import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import * as reviewService from '@/lib/services/reviewService';

/**
 * POST /api/reviews - Create a review
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

    const body = await request.json();
    const { orderId, serviceId, revieweeId, rating, comment, isOrderReview = true, isClientReview } = body;

    // Validate required fields
    if (!revieweeId) {
      return NextResponse.json(
        { error: 'revieweeId is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (isOrderReview === undefined) {
      return NextResponse.json(
        { error: 'isOrderReview is required' },
        { status: 400 }
      );
    }

    if (isClientReview === undefined) {
      return NextResponse.json(
        { error: 'isClientReview is required' },
        { status: 400 }
      );
    }

    const review = await reviewService.createReview({
      orderId,
      serviceId,
      reviewerId: user.id,
      revieweeId,
      rating: parseInt(rating),
      comment: comment?.trim() || null,
      isOrderReview,
      isClientReview,
    });

    return NextResponse.json({
      success: true,
      review,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/reviews - Get reviews
 * Query params:
 * - orderId: Get reviews for an order
 * - serviceId: Get reviews for a service (gig-based)
 * - userId: Get all reviews received by a user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const serviceId = searchParams.get('serviceId');
    const userId = searchParams.get('userId');

    let reviews = [];

    if (orderId) {
      reviews = await reviewService.getReviewsByOrderId(orderId);
    } else if (serviceId) {
      reviews = await reviewService.getReviewsByServiceId(serviceId);
    } else if (userId) {
      reviews = await reviewService.getReviewsByUserId(userId);
    } else {
      return NextResponse.json(
        { error: 'orderId, serviceId, or userId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reviews,
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 400 }
    );
  }
}


