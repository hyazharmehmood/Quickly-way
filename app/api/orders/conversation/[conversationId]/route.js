import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as contractService from '@/lib/services/contractService';

/**
 * GET /api/orders/conversation/[conversationId] - Get contract by conversation ID
 * Note: Endpoint is /api/orders for backward compatibility, but internally uses contracts
 */
export async function GET(request, { params }) {
  try {
    // Next.js 16: params is a Promise, must await
    const { conversationId } = await params;
    
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const contract = await contractService.getContractByConversationId(
      conversationId,
      user.id
    );

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found for this conversation' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contract,
      order: contract, // Backward compatibility
    });

  } catch (error) {
    console.error('Error fetching contract by conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

