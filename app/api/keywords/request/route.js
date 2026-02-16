import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';

async function getUserId() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.slice(7));
      return decoded?.id || null;
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/keywords/request - User requests a new keyword (created as PENDING; only creator sees until admin approves/rejects)
 */
export async function POST(request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const raw = body.keyword ?? body.name ?? '';
    const keyword = (typeof raw === 'string' ? raw.trim() : '') || '';
    if (!keyword || keyword.length < 2) {
      return NextResponse.json({ success: false, error: 'Keyword is required (min 2 characters)' }, { status: 400 });
    }

    const existing = await prisma.keyword.findUnique({
      where: { keyword },
    });
    if (existing) {
      if (existing.approvalStatus === 'APPROVED') {
        return NextResponse.json({ success: true, keyword: existing, message: 'Keyword already exists' });
      }
      if (existing.createdByUserId === userId) {
        return NextResponse.json({ success: true, keyword: existing, message: 'You already requested this keyword' });
      }
      return NextResponse.json({ success: false, error: 'This keyword is already requested by someone else' }, { status: 409 });
    }

    const created = await prisma.keyword.create({
      data: {
        keyword,
        isActive: true,
        approvalStatus: 'PENDING',
        createdByUserId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      keyword: { ...created, approvalStatus: 'PENDING' },
      message: 'Keyword requested. It will appear for everyone after admin approval.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error requesting keyword:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to request keyword' },
      { status: 500 }
    );
  }
}
