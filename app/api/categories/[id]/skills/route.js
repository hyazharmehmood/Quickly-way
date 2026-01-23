import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/categories/[id]/skills - Get all active skills for a category (public endpoint)
 * This endpoint is accessible to all authenticated users (freelancers/clients)
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Verify category exists and is active
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (!category.isActive) {
      return NextResponse.json(
        { error: 'Category is not available' },
        { status: 403 }
      );
    }

    const skills = await prisma.skill.findMany({
      where: {
        categoryId: id,
        isActive: true, // Only return active skills
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
      },
    });

    return NextResponse.json({
      success: true,
      skills,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

