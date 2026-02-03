import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/reviews - Get all reviews (admin only)
 * Query params:
 * - status: Filter by status (approved, flagged, pending)
 * - isFeatured: Filter by featured status
 * - rating: Filter by rating (1-5)
 * - orderId: Filter by order ID
 * - serviceId: Filter by service ID
 * - reviewerId: Filter by reviewer ID
 * - revieweeId: Filter by reviewee ID
 * - search: Search in comment
 * - isOrderReview: Filter by review type (true/false)
 */
export async function GET(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // approved, flagged, pending
    const isFeatured = searchParams.get('isFeatured');
    const rating = searchParams.get('rating');
    const orderId = searchParams.get('orderId');
    const serviceId = searchParams.get('serviceId');
    const reviewerId = searchParams.get('reviewerId');
    const revieweeId = searchParams.get('revieweeId');
    const search = searchParams.get('search');
    const isOrderReview = searchParams.get('isOrderReview');

    const where = {};

    if (status === 'approved') {
      where.isApproved = true;
      where.isFlagged = false;
    } else if (status === 'flagged') {
      where.isFlagged = true;
    } else if (status === 'pending') {
      where.isApproved = false;
      where.isFlagged = false;
    }

    if (isFeatured !== null && isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    if (rating) {
      where.rating = parseInt(rating);
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (reviewerId) {
      where.reviewerId = reviewerId;
    }

    if (revieweeId) {
      where.revieweeId = revieweeId;
    }

    if (isOrderReview !== null && isOrderReview !== undefined) {
      where.isOrderReview = isOrderReview === 'true';
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        flaggedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate metrics
    const totalReviews = await prisma.review.count();
    const approvedReviews = await prisma.review.count({ where: { isApproved: true, isFlagged: false } });
    const flaggedReviews = await prisma.review.count({ where: { isFlagged: true } });
    const pendingReviews = await prisma.review.count({ where: { isApproved: false, isFlagged: false } });
    
    // Calculate average rating
    const ratingData = await prisma.review.aggregate({
      where: { isApproved: true, isFlagged: false },
      _avg: { rating: true },
    });

    const metrics = {
      total: totalReviews,
      approved: approvedReviews,
      flagged: flaggedReviews,
      pending: pendingReviews,
      averageRating: ratingData._avg.rating ? parseFloat(ratingData._avg.rating.toFixed(2)) : 0,
    };

    return NextResponse.json({
      success: true,
      reviews,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

