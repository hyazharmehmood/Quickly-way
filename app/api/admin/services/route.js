import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/services - List services for admin (all or filter by status)
 * Query: ?status=PENDING_APPROVAL|APPROVED|REJECTED
 */
export async function GET(request) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING_APPROVAL, APPROVED, REJECTED

    const where = status ? { approvalStatus: status } : {};

    const services = await prisma.service.findMany({
      where,
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            location: true,
          },
        },
        skills: { include: { skill: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, services });
  } catch (err) {
    console.error('Admin services list error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
