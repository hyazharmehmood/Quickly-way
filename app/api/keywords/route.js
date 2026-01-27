import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/keywords - Get all active keywords (public endpoint for freelancers)
 * This endpoint is accessible to all authenticated users (freelancers/clients)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where = {
      isActive: true,
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

