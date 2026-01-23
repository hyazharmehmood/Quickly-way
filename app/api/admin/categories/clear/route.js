import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/admin/categories/clear
 * 
 * Clear all categories and skills from the database
 * WARNING: This is a destructive operation!
 */
export async function DELETE(request) {
  try {
    // 1. Verify admin authentication
    const { user, error } = await verifyAdminAuth(request);
    if (error) {
      return error;
    }

    // 2. Delete all skills first (due to foreign key constraint)
    const deletedSkills = await prisma.skill.deleteMany({});
    
    // 3. Delete all categories (subcategories will be deleted due to cascade)
    const deletedCategories = await prisma.category.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'All categories and skills cleared successfully',
      deleted: {
        categories: deletedCategories.count,
        skills: deletedSkills.count,
      },
    });
  } catch (error) {
    console.error('Error clearing categories and skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to clear categories and skills',
      },
      { status: 500 }
    );
  }
}

