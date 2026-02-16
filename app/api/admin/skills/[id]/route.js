import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug';

/**
 * GET /api/admin/skills/[id] - Get a single skill
 */
export async function GET(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const skill = await prisma.skill.findUnique({
      where: { id },
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

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      skill,
    });
  } catch (error) {
    console.error('Error fetching skill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skill' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/skills/[id] - Update a skill
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { name, categoryId, isActive, approvalStatus } = body;

    // Check if skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!existingSkill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    const updateData = {};
    const finalCategoryId = categoryId || existingSkill.categoryId;

    // Update name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Skill name cannot be empty' },
          { status: 400 }
        );
      }

      // Check if name is being changed and if new name already exists in category
      if (trimmedName !== existingSkill.name || finalCategoryId !== existingSkill.categoryId) {
        const nameExists = await prisma.skill.findUnique({
          where: {
            categoryId_name: {
              categoryId: finalCategoryId,
              name: trimmedName,
            },
          },
        });

        if (nameExists && nameExists.id !== id) {
          return NextResponse.json(
            { error: 'Skill name must be unique within the category' },
            { status: 409 }
          );
        }

        // Generate new slug if name or category changed
        const baseSlug = generateSlug(trimmedName);
        const slug = await generateUniqueSlug(
          baseSlug,
          async (slug) => {
            const exists = await prisma.skill.findUnique({
              where: {
                categoryId_slug: {
                  categoryId: finalCategoryId,
                  slug,
                },
              },
            });
            return !!exists && exists.id !== id; // Allow current skill's slug
          }
        );

        updateData.name = trimmedName;
        updateData.slug = slug;
      }
    }

    // Update categoryId if provided
    if (categoryId && categoryId !== existingSkill.categoryId) {
      // Verify new category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }

      // Check if skill name already exists in new category
      const nameExists = await prisma.skill.findUnique({
        where: {
          categoryId_name: {
            categoryId,
            name: existingSkill.name,
          },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'A skill with this name already exists in the target category' },
          { status: 409 }
        );
      }

      updateData.categoryId = categoryId;
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Approve or reject skill (admin only)
    if (approvalStatus === 'APPROVED' || approvalStatus === 'REJECTED') {
      updateData.approvalStatus = approvalStatus;
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: updateData,
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
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Skill name or slug already exists in this category' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update skill' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/skills/[id] - Soft delete (disable) a skill
 */
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Soft delete: set isActive to false
    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: { isActive: false },
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
      message: 'Skill disabled successfully',
      skill: updatedSkill,
    });
  } catch (error) {
    console.error('Error disabling skill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disable skill' },
      { status: 500 }
    );
  }
}

