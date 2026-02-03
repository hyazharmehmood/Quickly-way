import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/reviews/[id] - Get review details (admin only)
 */
export async function GET(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            createdAt: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            createdAt: true,
          },
        },
        order: {
          include: {
            service: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            freelancer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            freelancer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reviews/[id] - Update review (admin only)
 * Body:
 * - action: approve, flag, unflag, feature, unfeature
 * - flaggedReason: Reason for flagging (required if action is 'flag')
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { action, flaggedReason } = body;

    if (!action || !['approve', 'flag', 'unflag', 'feature', 'unfeature'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, flag, unflag, feature, or unfeature' },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const updateData = {};

    switch (action) {
      case 'approve':
        updateData.isApproved = true;
        updateData.isFlagged = false;
        updateData.approvedBy = user.id;
        updateData.approvedAt = new Date();
        updateData.flaggedReason = null;
        updateData.flaggedBy = null;
        updateData.flaggedAt = null;
        break;

      case 'flag':
        if (!flaggedReason || !flaggedReason.trim()) {
          return NextResponse.json(
            { error: 'flaggedReason is required when flagging a review' },
            { status: 400 }
          );
        }
        updateData.isFlagged = true;
        updateData.isApproved = false;
        updateData.flaggedReason = flaggedReason.trim();
        updateData.flaggedBy = user.id;
        updateData.flaggedAt = new Date();
        break;

      case 'unflag':
        updateData.isFlagged = false;
        updateData.flaggedReason = null;
        updateData.flaggedBy = null;
        updateData.flaggedAt = null;
        // Don't auto-approve, let admin review
        break;

      case 'feature':
        updateData.isFeatured = true;
        break;

      case 'unfeature':
        updateData.isFeatured = false;
        break;
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reviews/[id] - Delete review (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    // Update reviewee's rating if needed
    try {
      const reviews = await prisma.review.findMany({
        where: { revieweeId: review.revieweeId },
        select: { rating: true },
      });

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Update user rating if column exists
        try {
          await prisma.user.update({
            where: { id: review.revieweeId },
            data: {
              // rating: averageRating,        // Uncomment after migration
              // reviewCount: reviews.length,   // Uncomment after migration
            },
          });
        } catch (error) {
          // Rating column doesn't exist yet, skip update
          if (error.code !== 'P2021' && !error.message?.includes('does not exist')) {
            throw error;
          }
        }
      }
    } catch (error) {
      // If Review table doesn't exist, just continue
      if (error.code !== 'P2021' && !error.message?.includes('does not exist')) {
        console.error('Error updating user rating after review deletion:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}

