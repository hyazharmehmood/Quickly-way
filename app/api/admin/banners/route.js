import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { HTTP_STATUS } from '@/lib/shared/constants';

/**
 * GET /api/admin/banners
 * List all banners (admin only)
 * Ensures only one active banner in DB (keeps the first by sortOrder, createdAt)
 */
export async function GET(request) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    // Start a transaction to enforce single active banner
    const banners = await prisma.$transaction(async (tx) => {
      // Find the first active banner by order
      const firstActive = await tx.banner.findFirst({
        where: { isActive: true },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      // Deactivate all other active banners if more than one exists
      if (firstActive) {
        await tx.banner.updateMany({
          where: { isActive: true, id: { not: firstActive.id } },
          data: { isActive: false },
        });
      }

      // Return all banners sorted
      return tx.banner.findMany({
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    });

    return NextResponse.json({ success: true, banners }, { status: HTTP_STATUS.OK });
  } catch (err) {
    console.error('Admin banners list error:', err);
    return NextResponse.json(
      { success: false, error: err.message ?? 'Failed to fetch banners' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/admin/banners
 * Create a new banner (admin only)
 * Enforces single active banner automatically
 */
export async function POST(request) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    const { title, mobileImageUrl, desktopImageUrl, isActive = false, sortOrder = 0 } = await request.json();

    const mobile = mobileImageUrl?.trim() || null;
    const desktop = desktopImageUrl?.trim() || null;

    if (!mobile && !desktop) {
      return NextResponse.json(
        { success: false, error: 'Upload at least one image (mobile or desktop)' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Transaction ensures atomic deactivation + creation
    const banner = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.banner.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.banner.create({
        data: {
          title: title?.trim() || null,
          mobileImageUrl: mobile,
          desktopImageUrl: desktop,
          isActive,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        },
      });
    });

    return NextResponse.json({ success: true, banner }, { status: HTTP_STATUS.CREATED });
  } catch (err) {
    console.error('Admin banner create error:', err);
    return NextResponse.json(
      { success: false, error: err.message ?? 'Failed to create banner' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
