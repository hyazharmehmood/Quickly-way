import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as orderService from '@/lib/services/orderService';
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
        { error: 'Only clients and freelancers can create orders' },
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
    } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      );
    }

    // If freelancer is creating, clientId is required
    if (user.role === 'FREELANCER' && !clientId) {
      return NextResponse.json(
        { error: 'clientId is required when freelancer creates contract' },
        { status: 400 }
      );
    }

    // Get IP addresses
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     null;

    const order = await orderService.createOrder({
      serviceId,
      clientId: user.role === 'FREELANCER' ? clientId : user.id,
      freelancerId: user.role === 'FREELANCER' ? user.id : undefined,
      conversationId,
      deliveryTime: deliveryTime || 7,
      revisionsIncluded: revisionsIncluded || 0,
      scopeOfWork,
      cancellationPolicy: cancellationPolicy || 'Standard cancellation policy applies',
      price,
      clientIpAddress: user.role === 'CLIENT' ? ipAddress : null,
      freelancerIpAddress: user.role === 'FREELANCER' ? ipAddress : null,
    });

    // Emit Socket.IO event
    try {
      emitOrderEvent('ORDER_CREATED', order);
    } catch (socketError) {
      console.error('Failed to emit order event:', socketError);
      // Don't fail the request if socket emission fails
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
      select: { id: true, role: true },
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

    const orders = await orderService.getUserOrders(user.id, user.role, {
      status,
      serviceId,
      limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

