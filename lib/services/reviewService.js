import prisma from '@/lib/prisma';

/**
 * Create a review
 * Fiverr rules:
 * - Client review is mandatory first (for order-based reviews)
 * - Freelancer review unlocks only after client review
 * - Reviews are linked to the order
 * - Reviews update user profiles (rating + count)
 */
export async function createReview({
  orderId,
  serviceId,
  reviewerId,
  revieweeId,
  rating,
  comment,
  isOrderReview = true,
  isClientReview,
}) {
  // Validation
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  if (isOrderReview && !orderId) {
    throw new Error('orderId is required for order-based reviews');
  }

  if (!isOrderReview && !serviceId) {
    throw new Error('serviceId is required for service-based reviews');
  }

  // For order-based reviews, enforce Fiverr rules
  if (isOrderReview) {
    // Get existing reviews separately (temporarily until Review table is created)
    let existingReviews = [];
    try {
      existingReviews = await prisma.review.findMany({
        where: { orderId },
      });
    } catch (error) {
      // If Review table doesn't exist yet, return empty array
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        existingReviews = [];
      } else {
        throw error;
      }
    }
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      // reviews: true,  // Temporarily commented out - uncomment after running migration
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if order is completed
    if (order.status !== 'COMPLETED') {
      throw new Error('Can only review completed orders');
    }

    // Verify reviewer is part of the order
    const isClient = order.clientId === reviewerId;
    const isFreelancer = order.freelancerId === reviewerId;

    if (!isClient && !isFreelancer) {
      throw new Error('Unauthorized: You are not part of this order');
    }

    // Verify reviewee is the other party
    if (isClientReview && order.freelancerId !== revieweeId) {
      throw new Error('Invalid reviewee for client review');
    }
    if (!isClientReview && order.clientId !== revieweeId) {
      throw new Error('Invalid reviewee for freelancer review');
    }

    // Fiverr rule: Client review is mandatory first
    if (isClientReview) {
      // Check if client already reviewed
      const existingClientReview = existingReviews.find(
        r => r.reviewerId === reviewerId && r.isClientReview === true
      );
      if (existingClientReview) {
        throw new Error('You have already reviewed this order');
      }
    } else {
      // Freelancer review: Check if client review exists first
      const clientReview = existingReviews.find(
        r => r.isClientReview === true
      );
      if (!clientReview) {
        throw new Error('Client review is required before freelancer can review');
      }

      // Check if freelancer already reviewed
      const existingFreelancerReview = existingReviews.find(
        r => r.reviewerId === reviewerId && r.isClientReview === false
      );
      if (existingFreelancerReview) {
        throw new Error('You have already reviewed this order');
      }
    }
  } else {
    // Service-based review
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Verify reviewer is not the service owner
    if (service.freelancerId === reviewerId) {
      throw new Error('Cannot review your own service');
    }

    // Verify reviewee is the service owner
    if (service.freelancerId !== revieweeId) {
      throw new Error('Invalid reviewee for service review');
    }

    // Check if reviewer already reviewed this service
    try {
      const existingReview = await prisma.review.findFirst({
        where: {
          serviceId,
          reviewerId,
          isOrderReview: false,
        },
      });

      if (existingReview) {
        throw new Error('You have already reviewed this service');
      }
    } catch (error) {
      // If Review table doesn't exist yet, allow the review to proceed
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        // Table doesn't exist, skip the check
      } else if (error.message === 'You have already reviewed this service') {
        throw error; // Re-throw the "already reviewed" error
      } else {
        throw error;
      }
    }
  }

  // Create review (with error handling for missing table)
  let review;
  try {
    review = await prisma.review.create({
      data: {
        orderId,
        serviceId,
        reviewerId,
        revieweeId,
        rating,
        comment,
        isOrderReview,
        isClientReview,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        order: isOrderReview ? {
          select: {
            id: true,
            orderNumber: true,
          },
        } : undefined,
        service: !isOrderReview ? {
          select: {
            id: true,
            title: true,
          },
        } : undefined,
      },
    });

    // Update reviewee's rating and review count
    try {
      await updateUserRating(revieweeId);
    } catch (ratingError) {
      // If rating update fails (e.g., rating column doesn't exist), log but don't fail
      console.warn('Failed to update user rating:', ratingError.message);
    }

    return review;
  } catch (error) {
    // If Review table doesn't exist yet, provide helpful error
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      throw new Error('Review table does not exist. Please run database migrations: npx prisma migrate deploy');
    }
    throw error;
  }
}

/**
 * Update user's rating and review count
 */
async function updateUserRating(userId) {
  try {
    // Get all reviews for this user
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      // Only update if rating column exists
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            // rating: 0,        // Uncomment after migration
            // reviewCount: 0,   // Uncomment after migration
          },
        });
      } catch (error) {
        // Rating column doesn't exist yet, skip update
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          return;
        }
        throw error;
      }
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Update user (only if rating column exists)
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          // rating: averageRating,        // Uncomment after migration
          // reviewCount: reviews.length, // Uncomment after migration
        },
      });
    } catch (error) {
      // Rating column doesn't exist yet, skip update
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return;
      }
      throw error;
    }
  } catch (error) {
    // If Review table doesn't exist, just return
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return;
    }
    throw error;
  }
}

/**
 * Get reviews by order ID
 */
export async function getReviewsByOrderId(orderId) {
  try {
    const reviews = await prisma.review.findMany({
      where: { orderId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  } catch (error) {
    // If Review table doesn't exist yet, return empty array
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get reviews by service ID (gig-based reviews)
 */
export async function getReviewsByServiceId(serviceId) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        serviceId,
        isOrderReview: false, // Only service-based reviews
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  } catch (error) {
    // If Review table doesn't exist yet, return empty array
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get reviews by user ID (all reviews received by a user)
 */
export async function getReviewsByUserId(userId) {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  } catch (error) {
    // If Review table doesn't exist yet, return empty array
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
}

/**
 * Check if user can review (for order-based reviews)
 */
export async function canReviewOrder(orderId, userId) {
  // Get existing reviews separately (temporarily until Review table is created)
  let existingReviews = [];
  try {
    existingReviews = await prisma.review.findMany({
      where: { orderId },
    });
  } catch (error) {
    // If Review table doesn't exist yet, return empty array
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      existingReviews = [];
    } else {
      throw error;
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    // reviews: true,  // Temporarily commented out - uncomment after running migration
  });

  if (!order) {
    return { canReview: false, reason: 'Order not found' };
  }

  if (order.status !== 'COMPLETED') {
    return { canReview: false, reason: 'Order must be completed to review' };
  }

  const isClient = order.clientId === userId;
  const isFreelancer = order.freelancerId === userId;

  if (!isClient && !isFreelancer) {
    return { canReview: false, reason: 'You are not part of this order' };
  }

    // Check if client has reviewed
    const clientReview = existingReviews.find(r => r.isClientReview === true);
    const clientCanReview = isClient && !existingReviews.find(r => r.reviewerId === userId && r.isClientReview === true);
    const freelancerCanReview = isFreelancer && clientReview && !existingReviews.find(r => r.reviewerId === userId && r.isClientReview === false);

  if (isClient) {
    return {
      canReview: clientCanReview,
      reason: clientCanReview ? null : 'You have already reviewed this order',
      canReviewFreelancer: clientCanReview,
    };
  } else {
    return {
      canReview: freelancerCanReview,
      reason: freelancerCanReview ? null : (clientReview ? 'You have already reviewed this order' : 'Client review is required first'),
      canReviewClient: freelancerCanReview,
    };
  }
}

