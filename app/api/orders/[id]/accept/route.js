import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as contractService from '@/lib/services/contractService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders/[id]/accept - Accept contract by CLIENT
 * 
 * IMPORTANT FLOW:
 * 1. Freelancer sends Contract (offer) to Client
 * 2. Client accepts Contract → Contract status = ACTIVE
 * 3. System automatically creates Order with:
 *    - status = PENDING (waiting for payment)
 *    - paymentStatus = PENDING
 * 4. Order becomes ACTIVE only when payment is processed (future)
 * 5. Delivery countdown starts ONLY when order.status === ACTIVE
 * 
 * FUTURE: When payment is integrated:
 * - After payment success, call orderService.activateOrder()
 * - Order status will change to ACTIVE
 * - Freelancer can then start work
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
        { error: 'Only clients can accept contracts' },
        { status: 403 }
      );
    }

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     null;

    const contract = await contractService.acceptContract(
      id,
      user.id,
      user.role,
      ipAddress
    );

    // CRITICAL: Contract should now have order with status = PENDING
    // Order is automatically created when contract is accepted
    console.log('Contract accepted:', {
      contractId: contract.id,
      contractStatus: contract.status,
      orderId: contract.order?.id,
      orderStatus: contract.order?.status,
      paymentStatus: contract.order?.paymentStatus,
    });

    // Emit Socket.IO event with full contract data (including order)
    try {
      emitOrderEvent('CONTRACT_ACCEPTED', contract);
    } catch (socketError) {
      console.error('Failed to emit contract event:', socketError);
    }

    return NextResponse.json({
      success: true,
      contract, // Includes order with status = PENDING
      order: contract.order || contract, // Order data or contract for backward compatibility
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

