import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as orderService from '@/lib/services/orderService';
import { createNotification } from '@/lib/services/notificationService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders/[id]/deliver - Submit delivery by freelancer
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
      select: { id: true, role: true, isSeller: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const canDeliver = user.role === 'FREELANCER' || user.role === 'ADMIN' || (user.role === 'CLIENT' && user.isSeller);
    if (!canDeliver) {
      return NextResponse.json(
        { error: 'Only freelancers can submit deliveries' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, fileUrl, message, isRevision } = body;

    if (!type || !['FILE', 'MESSAGE', 'LINK'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type (FILE, MESSAGE, or LINK) is required' },
        { status: 400 }
      );
    }

    if (type === 'FILE' && !fileUrl) {
      return NextResponse.json(
        { error: 'fileUrl is required for FILE type' },
        { status: 400 }
      );
    }

    if (type === 'MESSAGE' && !message) {
      return NextResponse.json(
        { error: 'message is required for MESSAGE type' },
        { status: 400 }
      );
    }

    const result = await orderService.submitDelivery(
      id,
      user.id,
      {
        type,
        fileUrl,
        message,
        isRevision: isRevision || false,
      }
    );

    // Emit Socket.IO event
    try {
      emitOrderEvent('DELIVERY_SUBMITTED', result.order, {
        deliverable: result.deliverable,
      });
    } catch (socketError) {
      console.error('Failed to emit order event:', socketError);
    }

    // Notify client: freelancer delivered (or submitted revision)
    try {
      const order = result.order;
      const freelancerName = order.freelancer?.name || 'The seller';
      const isRevision = result.deliverable?.isRevision;
      await createNotification({
        userId: order.clientId,
        title: isRevision ? 'Revision submitted' : 'Delivery submitted',
        body: isRevision
          ? `${freelancerName} submitted a revision for order ${order.orderNumber}.`
          : `${freelancerName} delivered order ${order.orderNumber}. Please review.`,
        type: 'order',
        data: { orderId: order.id, linkUrl: `/orders/${order.id}` },
      });
    } catch (notifError) {
      console.error('Failed to create order notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      deliverable: result.deliverable,
    });

  } catch (error) {
    console.error('Error submitting delivery:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit delivery' },
      { status: 500 }
    );
  }
}

