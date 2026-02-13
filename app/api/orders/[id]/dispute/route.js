import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as orderService from '@/lib/services/orderService';
import { createNotification } from '@/lib/services/notificationService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders/[id]/dispute - Open dispute by client
 * Fiverr workflow: DELIVERED → Client can Open Dispute → DISPUTED
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only clients can open disputes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason, description, attachments } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      );
    }

    const result = await orderService.openDispute(
      id,
      user.id,
      reason.trim(),
      description.trim(),
      attachments || null
    );

    // Emit Socket.IO event
    try {
      emitOrderEvent('DISPUTE_OPENED', result.order, { disputeId: result.dispute.id });
    } catch (socketError) {
      console.error('Failed to emit order event:', socketError);
    }

    // Notify freelancer: client opened a dispute
    try {
      const order = result.order;
      const clientName = order.client?.name || 'The client';
      await createNotification({
        userId: order.freelancerId,
        title: 'Dispute opened',
        body: `${clientName} opened a dispute for order ${order.orderNumber}. Please respond.`,
        type: 'dispute',
        data: { orderId: order.id, disputeId: result.dispute.id, linkUrl: `/orders/${order.id}` },
      });
    } catch (notifError) {
      console.error('Failed to create dispute notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      dispute: result.dispute,
    });

  } catch (error) {
    console.error('Error opening dispute:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to open dispute' },
      { status: 400 }
    );
  }
}
