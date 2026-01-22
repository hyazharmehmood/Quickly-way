import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as contractService from '@/lib/services/contractService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders/[id]/complete - Accept delivery and complete contract by client
 * Note: Endpoint is /api/orders for backward compatibility, but internally uses contracts
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
        { error: 'Only clients can complete contracts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deliverableId } = body;

    if (!deliverableId) {
      return NextResponse.json(
        { error: 'deliverableId is required' },
        { status: 400 }
      );
    }

    const contract = await contractService.acceptDelivery(
      id,
      user.id,
      deliverableId
    );

    // Emit Socket.IO event
    try {
      emitOrderEvent('ORDER_COMPLETED', contract);
    } catch (socketError) {
      console.error('Failed to emit contract event:', socketError);
    }

    return NextResponse.json({
      success: true,
      contract,
      order: contract, // Backward compatibility
    });

  } catch (error) {
    console.error('Error completing contract:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to complete order' },
      { status: 500 }
    );
  }
}

