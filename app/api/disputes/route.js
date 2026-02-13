import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';

/**
 * GET /api/disputes - Get disputes for current user (as client or freelancer)
 * Query: status (OPEN, IN_REVIEW, RESOLVED, CLOSED)
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {
      OR: [{ clientId: user.id }, { freelancerId: user.id }],
    };
    if (status) {
      where.status = status;
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      disputes,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}
