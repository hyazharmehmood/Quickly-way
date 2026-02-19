import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { HTTP_STATUS } from '@/lib/shared/constants';

/**
 * PATCH /api/admin/banners/[id] - Update banner (admin only)
 * Body: { title?, mobileImageUrl?, desktopImageUrl?, isActive?, sortOrder? }
 * At least one of mobileImageUrl or desktopImageUrl must remain after update.
 */
export async function PATCH(request, { params }) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Banner ID required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const body = await request.json();
    const { title, mobileImageUrl, desktopImageUrl, isActive, sortOrder } = body;

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title?.trim() || null;
    if (mobileImageUrl !== undefined) updateData.mobileImageUrl = mobileImageUrl?.trim() || null;
    if (desktopImageUrl !== undefined) updateData.desktopImageUrl = desktopImageUrl?.trim() || null;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (Number.isFinite(sortOrder)) updateData.sortOrder = sortOrder;

    const finalMobile = updateData.mobileImageUrl !== undefined ? updateData.mobileImageUrl : existing.mobileImageUrl;
    const finalDesktop = updateData.desktopImageUrl !== undefined ? updateData.desktopImageUrl : existing.desktopImageUrl;
    if (!finalMobile && !finalDesktop) {
      return NextResponse.json(
        { success: false, error: 'At least one image (mobile or desktop) is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Only one banner can be active at a time: when activating this one, deactivate others
    let banner;
    if (updateData.isActive === true) {
      const [, updated] = await prisma.$transaction([
        prisma.banner.updateMany({
          where: { id: { not: id } },
          data: { isActive: false },
        }),
        prisma.banner.update({
          where: { id },
          data: updateData,
        }),
      ]);
      banner = updated;
    } else {
      banner = await prisma.banner.update({
        where: { id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, banner }, { status: HTTP_STATUS.OK });
  } catch (err) {
    if (err.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
    console.error('Admin banner update error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update banner' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/admin/banners/[id] - Delete banner (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Banner ID required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (err) {
    if (err.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
    console.error('Admin banner delete error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete banner' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
