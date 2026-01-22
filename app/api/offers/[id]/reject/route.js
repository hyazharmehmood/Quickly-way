import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as offerService from '@/lib/services/offerService';

/**
 * POST /api/offers/[id]/reject - Reject offer by client (no order created)
 */
export async function POST(request, { params }) {
  try {
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
        { error: 'Only clients can reject offers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { error: 'rejectionReason is required' },
        { status: 400 }
      );
    }

    const offer = await offerService.rejectOffer(
      id,
      user.id,
      user.role,
      rejectionReason.trim()
    );

    // Emit Socket.IO event
    try {
      const { emitOfferEvent } = require('@/lib/socket');
      emitOfferEvent('OFFER_REJECTED', offer);
    } catch (socketError) {
      console.error('Failed to emit offer event:', socketError);
    }

    return NextResponse.json({
      success: true,
      offer,
    });

  } catch (error) {
    console.error('Error rejecting offer:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to reject offer' },
      { status: 500 }
    );
  }
}

