import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';

/**
 * GET /api/admin/skills - Get all skills (with optional filters)
 */
export async function GET(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');

    const where = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    const approvalFilter = searchParams.get('approvalStatus'); // PENDING | APPROVED | REJECTED
    if (approvalFilter) {
      where.approvalStatus = approvalFilter;
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
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
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

/**
 * POST /api/admin/skills - Create a new skill
 */
export async function POST(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const body = await request.json();
    const { name, categoryId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if skill name already exists in this category
    const existingSkill = await prisma.skill.findUnique({
      where: {
        categoryId_name: {
          categoryId,
          name: trimmedName,
        },
      },
    });

    if (existingSkill) {
      return NextResponse.json(
        { error: 'Skill name must be unique within the category' },
        { status: 409 }
      );
    }

    // Generate unique slug within category
    const baseSlug = generateSlug(trimmedName);
    const slug = await generateUniqueSlug(
      baseSlug,
      async (slug) => {
        const exists = await prisma.skill.findUnique({
          where: {
            categoryId_slug: {
              categoryId,
              slug,
            },
          },
        });
        return !!exists;
      }
    );

    const skill = await prisma.skill.create({
      data: {
        name: trimmedName,
        slug,
        categoryId,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      skill,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Skill name or slug already exists in this category' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create skill' },
      { status: 500 }
    );
  }
}

