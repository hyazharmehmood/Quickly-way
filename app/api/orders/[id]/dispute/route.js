import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders/[id]/dispute - Open a dispute
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

    // Get order
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify user is client or freelancer
    if (order.clientId !== user.id && order.freelancerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        orderId: id,
        status: {
          not: 'CLOSED',
        },
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'Dispute already exists for this order' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason, description } = body;

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

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        orderId: id,
        clientId: order.clientId,
        freelancerId: order.freelancerId,
        reason: reason.trim(),
        description: description.trim(),
        status: 'OPEN',
      },
      include: {
        order: {
          include: {
            service: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            freelancer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'DISPUTED',
        events: {
          create: {
            userId: user.id,
            eventType: 'DISPUTE_OPENED',
            description: `Dispute opened: ${reason}`,
            metadata: {
              reason,
              description,
            },
          },
        },
      },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        contract: true,
      },
    });

    // Emit Socket.IO event
    try {
      emitOrderEvent('DISPUTE_OPENED', updatedOrder, { dispute });
    } catch (socketError) {
      console.error('Failed to emit order event:', socketError);
    }

    return NextResponse.json({
      success: true,
      dispute,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dispute' },
      { status: 500 }
    );
  }
}

