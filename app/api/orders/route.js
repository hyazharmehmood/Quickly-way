import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as contractService from '@/lib/services/contractService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/orders - Create a new contract (freelancer sends to client)
 * This is a freelancer platform - we use CONTRACT terminology
 * Note: Endpoint is /api/orders for backward compatibility, but internally uses contracts
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

    // Only FREELANCER can create contracts (send to clients)
    // This is a freelancer platform - contracts are sent by freelancers
    if (user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: 'Only freelancers can create contracts' },
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

    // clientId is required (freelancer sends contract to client)
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required to send contract' },
        { status: 400 }
      );
    }

    // Get IP addresses
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     null;

    // Create contract (freelancer sends to client)
    const contract = await contractService.createContract({
      serviceId,
      clientId: clientId,
      freelancerId: user.id, // Freelancer is creating the contract
      conversationId,
      deliveryTime: deliveryTime || 7,
      revisionsIncluded: revisionsIncluded || 0,
      scopeOfWork,
      cancellationPolicy: cancellationPolicy || 'Standard cancellation policy applies',
      price,
      clientIpAddress: null,
      freelancerIpAddress: ipAddress,
    });

    // Emit Socket.IO event (contract:created)
    try {
      emitOrderEvent('ORDER_CREATED', contract);
    } catch (socketError) {
      console.error('Failed to emit contract event:', socketError);
      // Don't fail the request if socket emission fails
    }

    return NextResponse.json({
      success: true,
      contract, // Return as 'contract' for consistency
      order: contract, // Keep 'order' for backward compatibility
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create contract' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders - Get user's contracts
 * Returns contracts for:
 * - FREELANCER: Contracts they sent to clients
 * - CLIENT: Contracts sent to them by freelancers
 * - ADMIN: All contracts in the system
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

    // Get contracts for user
    // ADMIN can see all contracts
    const contracts = await contractService.getUserContracts(user.id, user.role, {
      status,
      serviceId,
      limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      contracts, // Return as 'contracts' for consistency
      orders: contracts, // Keep 'orders' for backward compatibility
    });

  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

