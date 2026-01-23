import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Middleware to verify admin authentication
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: object, error: NextResponse|null}>} - User object or error response
 */
export async function verifyAdminAuth(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      };
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, name: true },
    });

    if (!user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      };
    }

    if (user.role !== 'ADMIN') {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        )
      };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Admin auth error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    };
  }
}

