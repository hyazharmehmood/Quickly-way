import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';

async function getOptionalUserId(request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);
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
 * GET /api/skills
 * - For dropdown: only APPROVED + isActive skills (global). If logged in, also include current user's PENDING and REJECTED skills.
 * - When ids= is provided (editing): include those skills even if pending/rejected so creator can see them.
 */
export async function GET(request) {
  try {
    const userId = await getOptionalUserId(request);
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const skillIds = searchParams.get('ids');
    const skillNames = searchParams.get('names');

    const orConditions = [
      { approvalStatus: 'APPROVED', ...(includeInactive ? {} : { isActive: true }) },
      ...(userId ? [
        { approvalStatus: 'PENDING', createdByUserId: userId },
        { approvalStatus: 'REJECTED', createdByUserId: userId },
      ] : []),
    ];
    if (skillIds) {
      const idsArray = skillIds.split(',').filter(Boolean);
      if (idsArray.length) orConditions.push({ id: { in: idsArray } });
    }
    if (skillNames) {
      const namesArray = skillNames.split(',').map((n) => n.trim()).filter(Boolean);
      if (namesArray.length) orConditions.push({ name: { in: namesArray } });
    }
    const where = { OR: orConditions };

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

