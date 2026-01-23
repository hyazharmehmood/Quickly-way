import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { generateSlug } from '@/lib/utils/slug';
import { generateUniqueSkillSlug, skillExistsInCategory } from '@/lib/services/categoryService';

/**
 * POST /api/admin/categories/[id]/skills - Add skills to existing category/subcategory
 */
export async function POST(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { skills } = body;

    if (!skills || !Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'skills must be an array' },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const createdSkills = [];

      for (const skillData of skills) {
        const { name, isActive = true } = skillData;

        if (!name || !name.trim()) {
          throw new Error('Skill name is required');
        }

        // Check if skill already exists in this category
        const existing = await skillExistsInCategory(
          category.id,
          name.trim(),
          tx
        );

        if (existing) {
          throw new Error(
            `Skill "${name}" already exists in category "${category.name}"`
          );
        }

        // Generate unique slug
        const baseSlug = generateSlug(name.trim());
        const uniqueSlug = await generateUniqueSkillSlug(category.id, baseSlug, tx);

        // Create skill
        const skill = await tx.skill.create({
          data: {
            name: name.trim(),
            slug: uniqueSlug,
            isActive,
            categoryId: category.id,
          },
        });

        createdSkills.push(skill);
      }

      return createdSkills;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      skills: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding skills:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add skills' },
      { status: 500 }
    );
  }
}

