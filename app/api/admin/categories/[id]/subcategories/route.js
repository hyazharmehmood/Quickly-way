import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { generateSlug } from '@/lib/utils/slug';
import { generateUniqueCategorySlug, categoryNameExistsInParent } from '@/lib/services/categoryService';

/**
 * POST /api/admin/categories/[id]/subcategories - Add subcategories to existing category
 */
export async function POST(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { subcategories } = body;

    if (!subcategories || !Array.isArray(subcategories)) {
      return NextResponse.json(
        { error: 'subcategories must be an array' },
        { status: 400 }
      );
    }

    // Check if main category exists
    const mainCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!mainCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const createdSubcategories = [];

      for (const subcatData of subcategories) {
        const { name, isActive = true } = subcatData;

        if (!name || !name.trim()) {
          throw new Error('Subcategory name is required');
        }

        // Check if subcategory already exists under this parent
        const existing = await categoryNameExistsInParent(
          name.trim(),
          mainCategory.id,
          tx
        );

        if (existing) {
          throw new Error(
            `Subcategory "${name}" already exists under "${mainCategory.name}"`
          );
        }

        // Generate unique slug
        const baseSlug = generateSlug(name.trim());
        const uniqueSlug = await generateUniqueCategorySlug(baseSlug, tx);

        // Create subcategory
        const subcategory = await tx.category.create({
          data: {
            name: name.trim(),
            slug: uniqueSlug,
            isActive,
            parentId: mainCategory.id,
          },
        });

        createdSubcategories.push(subcategory);
      }

      return createdSubcategories;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      subcategories: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding subcategories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add subcategories' },
      { status: 500 }
    );
  }
}

