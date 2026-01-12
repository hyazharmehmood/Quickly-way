import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, signRefreshToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function POST(request) {
    try {
        const { token, password, passwordConfirm } = await request.json();

        if (password !== passwordConfirm) {
            return NextResponse.json(
                { message: 'Passwords do not match.' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: {
                    gt: new Date(), // Expires > now
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Token is invalid or has expired.' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        // Update password and clear token
        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        // Generate new tokens (logic from backend: log them in immediately)
        const accessToken = signToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ id: user.id });

        // Update refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken }
        });

        return NextResponse.json(
            {
                message: 'Password reset successful.',
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            },
            { status: HTTP_STATUS.OK }
        );

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
