import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as orderService from '@/lib/services/orderService';
import { createNotification } from '@/lib/services/notificationService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders/[id]/accept - Accept order by client
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

    if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only clients can accept orders' },
        { status: 403 }
      );
    }

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     null;

    const order = await orderService.acceptOrder(
      id,
      user.id,
      user.role,
      ipAddress
    );

    // Emit Socket.IO event
    try {
      emitOrderEvent('ORDER_IN_PROGRESS', order);
    } catch (socketError) {
      console.error('Failed to emit order event:', socketError);
    }

    // Notify freelancer: client accepted order, now In Progress
    try {
      const clientName = order.client?.name || 'The client';
      await createNotification({
        userId: order.freelancerId,
        title: 'Order accepted',
        body: `${clientName} accepted order ${order.orderNumber}. It is now In Progress.`,
        type: 'order',
        data: { orderId: order.id, linkUrl: `/dashboard/seller/orders/${order.id}` },
      });
    } catch (notifError) {
      console.error('Failed to create order notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error accepting order:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to accept order' },
      { status: 500 }
    );
  }
}

