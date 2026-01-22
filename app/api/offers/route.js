import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as offerService from '@/lib/services/offerService';
const { emitOrderEvent } = require('@/lib/socket');

/**
 * POST /api/offers - Create a new offer (freelancer sends offer to client)
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

    // Only freelancers can create offers
    if (user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: 'Only freelancers can create offers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      serviceId,
      clientId, // Required
      conversationId,
      deliveryTime,
      revisionsIncluded,
      scopeOfWork,
      cancellationPolicy,
      price, // Optional - freelancer can set custom price
    } = body;

    if (!serviceId || !clientId) {
      return NextResponse.json(
        { error: 'serviceId and clientId are required' },
        { status: 400 }
      );
    }

    const offer = await offerService.createOffer({
      serviceId,
      clientId,
      freelancerId: user.id,
      conversationId,
      deliveryTime: deliveryTime || 7,
      revisionsIncluded: revisionsIncluded || 0,
      scopeOfWork,
      cancellationPolicy: cancellationPolicy || 'Standard cancellation policy applies',
      price,
    });

    // Emit Socket.IO event for new offer
    try {
      const { emitOfferEvent } = require('@/lib/socket');
      emitOfferEvent('OFFER_CREATED', offer);
    } catch (socketError) {
      console.error('Failed to emit offer event:', socketError);
    }

    return NextResponse.json({
      success: true,
      offer,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create offer' },
      { status: 500 }
    );
  }
}

