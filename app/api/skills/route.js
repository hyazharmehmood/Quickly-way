import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/skills - Get all active skills (public endpoint)
 * This endpoint is accessible to all authenticated users (freelancers/clients)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const skillIds = searchParams.get('ids'); // Comma-separated skill IDs to include even if inactive
    const skillNames = searchParams.get('names'); // Comma-separated skill names to include even if inactive

    const where = {};
    
    // If includeInactive is false, only show active skills
    // But if skillIds or skillNames are provided, include those even if inactive
    if (!includeInactive) {
      if (skillIds) {
        const idsArray = skillIds.split(',').filter(Boolean);
        where.OR = [
          { isActive: true },
          { id: { in: idsArray } }
        ];
      } else if (skillNames) {
        const namesArray = skillNames.split(',').filter(Boolean);
        where.OR = [
          { isActive: true },
          { name: { in: namesArray } }
        ];
      } else {
        where.isActive = true;
      }
    }

    const skills = await prisma.skill.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        },
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      skills,
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

