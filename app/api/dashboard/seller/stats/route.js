import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';

/**
 * GET /api/dashboard/seller/stats
 * Returns real metrics for the logged-in freelancer: earnings, orders, offers, rating.
 */
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isSeller: true, sellerStatus: true, rating: true, reviewCount: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isFreelancer = user.role === 'FREELANCER' || user.role === 'ADMIN' || (user.role === 'CLIENT' && user.isSeller && user.sellerStatus === 'APPROVED');
    if (!isFreelancer) {
      return NextResponse.json({ error: 'Not a freelancer' }, { status: 403 });
    }

    // Orders where current user is the freelancer
    const [
      totalEarningsResult,
      activeOrdersCount,
      completedOrdersCount,
      deliveredCount,
      pendingAcceptanceCount,
      pendingOffersCount,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { freelancerId: userId, status: 'COMPLETED' },
        _sum: { price: true },
      }),
      prisma.order.count({
        where: {
          freelancerId: userId,
          status: { in: ['IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'PENDING_ACCEPTANCE'] },
        },
      }),
      prisma.order.count({
        where: { freelancerId: userId, status: 'COMPLETED' },
      }),
      prisma.order.count({
        where: { freelancerId: userId, status: 'DELIVERED' },
      }),
      prisma.order.count({
        where: { freelancerId: userId, status: 'PENDING_ACCEPTANCE' },
      }),
      prisma.offer.count({
        where: { freelancerId: userId, status: 'PENDING' },
      }),
    ]);

    const totalEarnings = totalEarningsResult._sum?.price ?? 0;
    const avgRating = user.rating != null ? Number(user.rating) : 0;
    const reviewCount = user.reviewCount ?? 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalEarnings,
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        deliveredOrders: deliveredCount,
        pendingRequests: pendingAcceptanceCount,
        pendingOffers: pendingOffersCount,
        avgRating: avgRating.toFixed(1),
        reviewCount,
      },
    });
  } catch (error) {
    console.error('Freelancer stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load stats' },
      { status: 500 }
    );
  }
}
