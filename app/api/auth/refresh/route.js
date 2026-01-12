import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function POST(request) {
    try {
        const { refreshToken } = await request.json();

        if (!refreshToken) {
            return NextResponse.json(
                { message: 'Refresh token is required' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        // Verify token signature
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return NextResponse.json(
                { message: 'Invalid refresh token' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        // Check if token matches DB
        const user = await prisma.user.findFirst({
            where: {
                id: decoded.id,
                refreshToken: refreshToken,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid refresh token' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        // Generate new tokens
        const newAccessToken = signToken({ id: user.id, email: user.email, role: user.role });
        const newRefreshToken = signRefreshToken({ id: user.id });

        // Update DB
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });

        return NextResponse.json(
            {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
            { status: HTTP_STATUS.OK }
        );
    } catch (error) {
        console.error('Refresh error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
