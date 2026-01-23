import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as offerService from '@/lib/services/offerService';

/**
 * GET /api/offers/[id] - Get offer by ID
 */
export async function GET(request, { params }) {
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

    const offer = await offerService.getOfferById(id, user.id, user.role);

    return NextResponse.json({
      success: true,
      offer,
    });

  } catch (error) {
    console.error('Error fetching offer:', error);
    
    if (error.message === 'Offer not found' || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Offer not found' ? 404 : 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}


