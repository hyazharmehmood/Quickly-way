import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function GET(request) {
  try {
    const { error } = await verifyAdminAuth(request);
    if (error) return error;

    const requests = await prisma.roleAgreementRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSeller: true,
            sellerStatus: true,
            location: true,
            phoneNumber: true,
            bio: true,
            profileImage: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, requests }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Admin role agreement requests list error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
