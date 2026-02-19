import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as orderService from '@/lib/services/orderService';
import { createNotification } from '@/lib/services/notificationService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders - Create a new order
 */
export async function POST(request) {
  try {
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

    // Allow both CLIENT and FREELANCER to create orders
    if (user.role !== 'CLIENT' && user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: 'Only clients and sellers can create orders' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      serviceId,
      clientId, // Required if freelancer is creating
      conversationId,
      deliveryTime,
      revisionsIncluded,
      scopeOfWork,
      cancellationPolicy,
      price, // Optional - freelancer can set custom price
      paymentMethodUsed,
    } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      );
    }

    // Only clients can create orders directly
    if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only clients can create orders. Sellers should use offers instead.' },
        { status: 403 }
      );
    }

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     null;

    const order = await orderService.createOrder({
      serviceId,
      clientId: user.id,
      conversationId,
      deliveryTime: deliveryTime || 7,
      revisionsIncluded: revisionsIncluded || 0,
      price,
      paymentMethodUsed: paymentMethodUsed || null,
      clientIpAddress: ipAddress,
    });

    // Emit Socket.IO event
    try {
      emitOrderEvent('ORDER_CREATED', order);
    } catch (socketError) {
      console.error('Failed to emit order event:', socketError);
    }

    // Notify freelancer: new order
    try {
      const clientName = order.client?.name || 'A client';
      await createNotification({
        userId: order.freelancerId,
        title: 'New order',
        body: `${clientName} placed a new order (${order.orderNumber}).`,
        type: 'order',
        data: { orderId: order.id, linkUrl: `/dashboard/seller/orders/${order.id}` },
      });
    } catch (notifError) {
      console.error('Failed to create order notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      order,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders - Get user's orders
 */
export async function GET(request) {
  try {
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
      select: { id: true, role: true, isSeller: true, sellerStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const serviceId = searchParams.get('serviceId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const isApprovedSeller = user.role === 'CLIENT' && user.isSeller && user.sellerStatus === 'APPROVED';

    const result = await orderService.getUserOrders(user.id, user.role, {
      isApprovedSeller,
      status,
      serviceId,
      limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      orders: result.orders || [],
      total: result.total || 0,
      limit: result.limit || limit,
      skip: result.skip || skip,
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

