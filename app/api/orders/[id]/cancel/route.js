import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as orderService from '@/lib/services/orderService';
import { createNotification } from '@/lib/services/notificationService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders/[id]/cancel - Cancel order
 */
export async function POST(request, { params }) {
  try {
    // Next.js 16: params is a Promise, must await
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

    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    const order = await orderService.cancelOrder(
      id,
      user.id,
      reason.trim(),
      user.role
    );

    // Emit Socket.IO event
    try {
      emitOrderEvent('ORDER_CANCELLED', order, { reason: reason.trim() });
    } catch (socketError) {
      console.error('Failed to emit order event:', socketError);
    }

    // Notify the other party: order cancelled
    try {
      const notifyUserId = user.id === order.clientId ? order.freelancerId : order.clientId;
      const actorName = order.clientId === user.id
        ? (order.client?.name || 'The client')
        : (order.freelancer?.name || 'The freelancer');
      await createNotification({
        userId: notifyUserId,
        title: 'Order cancelled',
        body: `${actorName} cancelled order ${order.orderNumber}.`,
        type: 'order',
        data: { orderId: order.id, linkUrl: `/orders/${order.id}` },
      });
    } catch (notifError) {
      console.error('Failed to create order notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

