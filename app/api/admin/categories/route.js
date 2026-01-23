import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';

/**
 * GET /api/admin/categories - Get all categories (with optional filters)
 */
export async function GET(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const includeSkills = searchParams.get('includeSkills') === 'true';

    const where = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: isActive !== null ? { isActive: isActive === 'true' } : undefined,
          include: {
            skills: includeSkills ? {
              where: isActive !== null ? { isActive: isActive === 'true' } : undefined,
              orderBy: { name: 'asc' },
            } : false,
            _count: {
              select: { skills: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        skills: includeSkills ? {
          where: isActive !== null ? { isActive: isActive === 'true' } : undefined,
          orderBy: { name: 'asc' },
        } : false,
        _count: {
          select: { 
            skills: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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

/**
 * POST /api/admin/categories - Create a new category
 */
export async function POST(request) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: trimmedName },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name must be unique' },
        { status: 409 }
      );
    }

    // Generate unique slug
    const baseSlug = generateSlug(trimmedName);
    const slug = await generateUniqueSlug(
      baseSlug,
      async (slug) => {
        const exists = await prisma.category.findUnique({ where: { slug } });
        return !!exists;
      }
    );

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug,
        isActive: true,
      },
      include: {
        _count: {
          select: { skills: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      category,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name or slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

