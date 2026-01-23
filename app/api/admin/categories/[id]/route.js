import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';

/**
 * GET /api/admin/categories/[id] - Get a single category
 */
export async function GET(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            skills: {
              orderBy: { name: 'asc' },
            },
            _count: {
              select: { skills: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        skills: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { 
            skills: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/categories/[id] - Update a category
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { name, isActive } = body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const updateData = {};

    // Update name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Category name cannot be empty' },
          { status: 400 }
        );
      }

      // Check if name is being changed and if new name already exists within same parent
      if (trimmedName !== existingCategory.name) {
        const nameExists = await prisma.category.findFirst({
          where: { 
            name: trimmedName,
            parentId: existingCategory.parentId || null,
            id: { not: id }, // Exclude current category
          },
        });

        if (nameExists) {
          return NextResponse.json(
            { error: 'Category name must be unique within the same parent' },
            { status: 409 }
          );
        }

        // Generate new slug if name changed
        const baseSlug = generateSlug(trimmedName);
        const slug = await generateUniqueSlug(
          baseSlug,
          async (slug) => {
            const exists = await prisma.category.findUnique({ 
              where: { slug },
            });
            return !!exists && exists.id !== id; // Allow current category's slug
          }
        );

        updateData.name = trimmedName;
        updateData.slug = slug;
      }
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        children: {
          include: {
            skills: {
              orderBy: { name: 'asc' },
            },
            _count: {
              select: { skills: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        skills: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { 
            skills: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name or slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id] - Soft delete (disable) a category
 */
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Soft delete: set isActive to false
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { isActive: false },
      include: {
        _count: {
          select: { skills: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category disabled successfully',
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Error disabling category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disable category' },
      { status: 500 }
    );
  }
}

