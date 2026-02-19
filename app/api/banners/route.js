import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/banners - Public: fetch active banners for display
 * Query: ?device=MOBILE|DESKTOP - required
 * Returns banners with the correct image for the device (mobileImageUrl for mobile, desktopImageUrl for desktop)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceParam = searchParams.get('device'); // MOBILE or DESKTOP
    const device = deviceParam === 'MOBILE' ? 'MOBILE' : 'DESKTOP';

    // Only one banner is active at a time; return that one for display
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        ...(device === 'MOBILE'
          ? { mobileImageUrl: { not: null } }
          : { desktopImageUrl: { not: null } }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 1,
    });

    // Map to include only the relevant image URL for the device
    const mapped = banners.map((b) => ({
      id: b.id,
      title: b.title,
      imageUrl: device === 'MOBILE' ? b.mobileImageUrl : b.desktopImageUrl,
    }));

    return NextResponse.json({ success: true, banners: mapped });
  } catch (error) {
    console.error('Banners fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}
