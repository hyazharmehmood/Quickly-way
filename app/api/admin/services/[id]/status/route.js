import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { createNotification } from '@/lib/services/notificationService';

/**
 * PATCH /api/admin/services/[id]/status - Approve or reject a service (admin only)
 * Body: { action: 'APPROVE' | 'REJECT' | 'PENDING_APPROVAL', rejectionReason?: string }
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Service ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    const validActions = ['APPROVE', 'APPROVED', 'REJECT', 'REJECTED', 'PENDING_APPROVAL'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be APPROVE/APPROVED, REJECT/REJECTED, or PENDING_APPROVAL' },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    const statusValue = (action === 'APPROVE' || action === 'APPROVED') ? 'APPROVED' : (action === 'REJECT' || action === 'REJECTED') ? 'REJECTED' : 'PENDING_APPROVAL';
    const updateData = {
      approvalStatus: statusValue,
      rejectionReason: action === 'REJECT' ? (rejectionReason?.trim() || 'No reason provided') : null,
      reviewedAt: new Date(),
      reviewedById: user.id,
    };

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify the seller (creator) in real time
    try {
      const sellerId = updated.freelancerId || updated.freelancer?.id;
      if (sellerId) {
        const isApproved = statusValue === 'APPROVED';
        await createNotification({
          userId: sellerId,
          title: isApproved ? 'Your service is now live' : 'Your service was not approved',
          body: isApproved
            ? `Your service "${updated.title}" has been approved and is now visible to buyers.`
            : `Your service "${updated.title}" was not approved.${updated.rejectionReason ? ` Reason: ${updated.rejectionReason}` : ''}`,
          type: 'service_review',
          priority: isApproved ? 'normal' : 'high',
          data: {
            serviceId: updated.id,
            approvalStatus: statusValue,
            rejectionReason: updated.rejectionReason || null,
          },
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify seller of service review:', notifErr);
    }

    return NextResponse.json({ success: true, service: updated });
  } catch (err) {
    if (err.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    console.error('Admin service status update error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update service' },
      { status: 500 }
    );
  }
}
