import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, signRefreshToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid email or password.' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid email or password.' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        // Generate JWTs
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = signRefreshToken({ id: user.id });

        // Save refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        return NextResponse.json(
            {
                message: 'Logged in successfully.',
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isSeller: user.isSeller,
                    sellerStatus: user.sellerStatus,
                },
            },
            { status: HTTP_STATUS.OK }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
