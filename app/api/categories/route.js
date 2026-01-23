import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/categories - Get all active categories (public endpoint for freelancers)
 * This endpoint is accessible to all authenticated users (freelancers/clients)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSkills = searchParams.get('includeSkills') === 'true';

    const categories = await prisma.category.findMany({
      where: {
        isActive: true, // Only return active categories
      },
      include: {
        skills: includeSkills ? {
          where: { isActive: true }, // Only return active skills
          orderBy: { name: 'asc' },
        } : false,
        _count: {
          select: { skills: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

