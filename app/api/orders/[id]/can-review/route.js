import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as reviewService from '@/lib/services/reviewService';

/**
 * GET /api/orders/[id]/can-review - Check if user can review an order
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

    const result = await reviewService.canReviewOrder(id, user.id);

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check review eligibility' },
      { status: 400 }
    );
  }
}


