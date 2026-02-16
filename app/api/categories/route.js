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
    const includeChildren = searchParams.get('includeChildren') !== 'false'; // Default true

    // Get only root categories (main categories without parent)
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // Only root categories
      },
      include: {
        children: includeChildren ? {
          where: { isActive: true },
          include: {
            skills: includeSkills ? {
              where: { isActive: true, approvalStatus: 'APPROVED' },
              orderBy: { name: 'asc' },
            } : false,
            _count: {
              select: { skills: true },
            },
          },
          orderBy: { name: 'asc' },
        } : false,
        skills: includeSkills ? {
          where: { isActive: true, approvalStatus: 'APPROVED' },
          orderBy: { name: 'asc' },
        } : false,
        _count: {
          select: { 
            skills: true,
            children: true,
          },
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

