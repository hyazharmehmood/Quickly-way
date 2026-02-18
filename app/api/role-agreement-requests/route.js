import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/controllers/authController';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const body = await request.json();
    const { requestedRole, agreed } = body;

    if (!['CLIENT', 'FREELANCER'].includes(requestedRole) || agreed !== true) {
      return NextResponse.json(
        { message: 'requestedRole (CLIENT or FREELANCER) and agreed: true are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const existing = await prisma.roleAgreementRequest.findUnique({
      where: {
        userId_requestedRole: { userId, requestedRole },
      },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          { message: 'You already have a pending request for this role.' },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      // REJECTED: allow re-apply by updating to PENDING
      const updated = await prisma.roleAgreementRequest.update({
        where: { id: existing.id },
        data: { status: 'PENDING', agreedAt: new Date(), rejectionReason: null, reviewedAt: null, reviewedById: null },
      });
      return NextResponse.json({ success: true, request: updated }, { status: HTTP_STATUS.OK });
    }

    const req = await prisma.roleAgreementRequest.create({
      data: {
        userId,
        requestedRole,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, request: req }, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    console.error('Role agreement request create error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
