import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/disputes - Get all disputes (admin only)
 * Query params:
 * - status: Filter by status (OPEN, IN_REVIEW, RESOLVED, CLOSED)
 * - orderId: Filter by order ID
 * - clientId: Filter by client ID
 * - freelancerId: Filter by freelancer ID
 * - search: Search in reason/description
 */
export async function GET(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const clientId = searchParams.get('clientId');
    const freelancerId = searchParams.get('freelancerId');
    const search = searchParams.get('search');

    const where = {};

    if (status) {
      where.status = status;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (freelancerId) {
      where.freelancerId = freelancerId;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            price: true,
            currency: true,
            service: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate metrics
    const metrics = {
      open: await prisma.dispute.count({ where: { status: 'OPEN' } }),
      inReview: await prisma.dispute.count({ where: { status: 'IN_REVIEW' } }),
      resolved: await prisma.dispute.count({ where: { status: 'RESOLVED' } }),
      closed: await prisma.dispute.count({ where: { status: 'CLOSED' } }),
      total: await prisma.dispute.count(),
    };

    return NextResponse.json({
      success: true,
      disputes,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}

