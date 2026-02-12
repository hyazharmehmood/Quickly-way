import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/stats - Dashboard stats (admin only): total users, orders, services, revenue
 */
export async function GET(request) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    const [totalUsers, totalOrders, activeServices, revenueResult] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.service.count(),
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { price: true },
      }),
    ]);

    const revenue = revenueResult._sum?.price ?? 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        activeServices,
        revenue,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load stats' },
      { status: 500 }
    );
  }
}
