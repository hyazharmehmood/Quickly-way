import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { createNotification } from '@/lib/services/notificationService';

export async function PATCH(request, { params }) {
  try {
    const { error, user: adminUser } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { message: 'status must be APPROVED or REJECTED' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const req = await prisma.roleAgreementRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!req) {
      return NextResponse.json({ message: 'Request not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    if (req.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Request is no longer pending' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    await prisma.roleAgreementRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? (reason || null) : null,
        reviewedAt: new Date(),
        reviewedById: adminUser.id,
      },
    });

    const userId = req.userId;
    const requestedRole = req.requestedRole;

    if (status === 'APPROVED') {
      if (requestedRole === 'FREELANCER') {
        await prisma.user.update({
          where: { id: userId },
          data: { isSeller: true, sellerStatus: 'APPROVED' },
        });
      } else {
        // CLIENT
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'CLIENT' },
        });
      }
    }

    await createNotification({
      userId,
      title: status === 'APPROVED' ? `Join as ${requestedRole === 'FREELANCER' ? 'Seller' : 'Client'} approved` : `Join as ${requestedRole === 'FREELANCER' ? 'Seller' : 'Client'} rejected`,
      body:
        status === 'APPROVED'
          ? requestedRole === 'FREELANCER'
            ? 'You now have access to the seller dashboard.'
            : 'You now have client access.'
          : reason || 'Your request was not approved.',
      type: 'role.agreement',
      priority: status === 'APPROVED' ? 'normal' : 'high',
      data: { requestId: id, status, requestedRole },
    });

    return NextResponse.json({ success: true, message: `Request ${status.toLowerCase()} successfully` }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Admin role agreement status update error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
