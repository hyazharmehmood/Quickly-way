import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/keywords - Get all keywords (with optional filters)
 */
export async function GET(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.keyword = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const keywords = await prisma.keyword.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
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

/**
 * POST /api/admin/keywords - Create a new keyword
 */
export async function POST(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const body = await request.json();
    const { keyword, volume, difficulty, rank, trend, isActive = true } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Check if keyword already exists
    const existing = await prisma.keyword.findUnique({
      where: { keyword: keyword.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Keyword already exists' },
        { status: 409 }
      );
    }

    const newKeyword = await prisma.keyword.create({
      data: {
        keyword: keyword.trim(),
        volume: volume || null,
        difficulty: difficulty || null,
        rank: rank || null,
        trend: trend || null,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      keyword: newKeyword,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating keyword:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create keyword' },
      { status: 500 }
    );
  }
}



