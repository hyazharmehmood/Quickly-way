import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/keywords/[id] - Get a single keyword
 */
export async function GET(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const keyword = await prisma.keyword.findUnique({
      where: { id },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      keyword,
    });
  } catch (error) {
    console.error('Error fetching keyword:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keyword' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/keywords/[id] - Update a keyword
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { keyword, volume, difficulty, rank, trend, isActive } = body;

    // Check if keyword exists
    const existing = await prisma.keyword.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // If keyword name is being changed, check for duplicates
    if (keyword && keyword.trim() !== existing.keyword) {
      const duplicate = await prisma.keyword.findUnique({
        where: { keyword: keyword.trim() },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Keyword already exists' },
          { status: 409 }
        );
      }
    }

    const updateData = {};
    if (keyword !== undefined) updateData.keyword = keyword.trim();
    if (volume !== undefined) updateData.volume = volume;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (rank !== undefined) updateData.rank = rank;
    if (trend !== undefined) updateData.trend = trend;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.keyword.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      keyword: updated,
    });
  } catch (error) {
    console.error('Error updating keyword:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update keyword' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/keywords/[id] - Delete a keyword (soft delete by setting isActive to false)
 */
export async function DELETE(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const keyword = await prisma.keyword.findUnique({
      where: { id },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.keyword.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Keyword deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}








