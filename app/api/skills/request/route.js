import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';

async function getUserId(request) {
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
 * POST /api/skills/request - Freelancer requests a new skill (creates as PENDING; only creator sees until admin approves/rejects)
 */
export async function POST(request) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { name, categoryId } = body;
    const trimmedName = (name && typeof name === 'string' ? name.trim() : '') || '';
    if (!trimmedName) {
      return NextResponse.json({ success: false, error: 'Skill name is required' }, { status: 400 });
    }

    if (!categoryId) {
      const firstSub = await prisma.category.findFirst({
        where: { parentId: { not: null }, isActive: true },
        orderBy: { name: 'asc' },
      });
      if (!firstSub) {
        return NextResponse.json({ success: false, error: 'No category available. Please contact admin.' }, { status: 400 });
      }
      categoryId = firstSub.id;
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    const existing = await prisma.skill.findUnique({
      where: {
        categoryId_name: { categoryId, name: trimmedName },
      },
    });
    if (existing) {
      if (existing.approvalStatus === 'APPROVED') {
        return NextResponse.json({ success: true, skill: existing, message: 'Skill already exists' });
      }
      if (existing.createdByUserId === userId) {
        return NextResponse.json({ success: true, skill: existing, message: 'You already requested this skill' });
      }
      return NextResponse.json({ success: false, error: 'This skill name is already requested by someone else' }, { status: 409 });
    }

    const baseSlug = generateSlug(trimmedName);
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const ex = await prisma.skill.findUnique({
        where: { categoryId_slug: { categoryId, slug: s } },
      });
      return !!ex;
    });

    const skill = await prisma.skill.create({
      data: {
        name: trimmedName,
        slug,
        categoryId,
        isActive: true,
        approvalStatus: 'PENDING',
        createdByUserId: userId,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      skill,
      message: 'Skill requested. It will appear for everyone after admin approval.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error requesting skill:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to request skill' },
      { status: 500 }
    );
  }
}
