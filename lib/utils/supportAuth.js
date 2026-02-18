import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Get optional user from request (for support ticket APIs - guest or logged in).
 * @param {Request} request
 * @returns {Promise<{user: object|null, error: NextResponse|null}>}
 */
export async function getOptionalUser(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return { user: null, error: null };

    const decoded = verifyToken(token);
    if (!decoded?.id) return { user: null, error: null };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, name: true },
    });
    return { user: user || null, error: null };
  } catch (e) {
    return { user: null, error: null };
  }
}
