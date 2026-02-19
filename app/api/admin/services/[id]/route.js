import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/admin/services/[id] - Get single service for admin view
 */
export async function GET(request, { params }) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Service ID required' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            location: true,
            bio: true,
          },
        },
        skills: { include: { skill: true } },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, service });
  } catch (err) {
    console.error('Admin service get error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch service' },
      { status: 500 }
    );
  }
}
