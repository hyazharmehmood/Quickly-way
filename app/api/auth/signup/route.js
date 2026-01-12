import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, signRefreshToken } from '@/lib/utils/jwt';
import { HTTP_STATUS, USER_ROLES, SELLER_STATUS } from '@/lib/shared/constants';

export async function POST(request) {
    try {
        const { name, email, password } = await request.json();

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'A user with this email already exists.' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: USER_ROLES.CLIENT, // Default role
                isSeller: false,
                sellerStatus: SELLER_STATUS.NONE,
            },
        });

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
                message: 'User registered successfully.',
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
            { status: HTTP_STATUS.CREATED }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
