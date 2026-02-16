import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';

async function getOptionalUserId() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.slice(7));
      return decoded?.id || null;
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/keywords - Only APPROVED keywords for everyone; if logged in, also current user's PENDING and REJECTED
 */
export async function GET(request) {
  try {
    const userId = await getOptionalUserId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where = {
      OR: [
        { approvalStatus: 'APPROVED', isActive: true },
        ...(userId ? [
          { approvalStatus: 'PENDING', createdByUserId: userId },
          { approvalStatus: 'REJECTED', createdByUserId: userId },
        ] : []),
      ],
    };

    if (search) {
      where.keyword = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const keywords = await prisma.keyword.findMany({
      where,
      orderBy: { keyword: 'asc' },
      select: {
        id: true,
        keyword: true,
        volume: true,
        difficulty: true,
        rank: true,
        trend: true,
        approvalStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      keywords,
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}








