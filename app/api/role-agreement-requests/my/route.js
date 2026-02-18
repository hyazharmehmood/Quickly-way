import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/controllers/authController';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const requests = await prisma.roleAgreementRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('My role agreement requests error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
