import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as offerService from '@/lib/services/offerService';
import { createNotification } from '@/lib/services/notificationService';
const { emitOrderEvent, emitOfferEvent } = require('@/lib/socket');

/**
 * POST /api/offers/[id]/accept - Accept offer by client (creates order)
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
        { error: 'Only clients can accept offers' },
        { status: 403 }
      );
    }

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     null;

    const { offer, order } = await offerService.acceptOffer(
      id,
      user.id,
      user.role,
      ipAddress
    );

    // Emit Socket.IO events
    try {
      emitOfferEvent('OFFER_ACCEPTED', offer);
      emitOrderEvent('ORDER_CREATED', order);
    } catch (socketError) {
      console.error('Failed to emit events:', socketError);
    }

    // Notify freelancer: client accepted their offer, order created
    try {
      const clientName = offer.client?.name || 'The client';
      await createNotification({
        userId: offer.freelancerId,
        title: 'Offer accepted',
        body: `${clientName} accepted your offer. An order has been created.`,
        type: 'order',
        data: { orderId: order.id, offerId: offer.id, linkUrl: `/dashboard/freelancer/orders/${order.id}` },
      });
    } catch (notifError) {
      console.error('Failed to create accept-offer notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      offer,
      order,
    });

  } catch (error) {
    console.error('Error accepting offer:', error);
    
    if (error.message.includes('not found') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not found') ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to accept offer' },
      { status: 500 }
    );
  }
}

