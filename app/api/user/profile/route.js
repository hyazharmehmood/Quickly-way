import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function PUT(request) {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ message: 'Invalid token' }, { status: HTTP_STATUS.UNAUTHORIZED });
        }

        const { name, bio, skills, portfolio } = await request.json();

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: decoded.id },
            data: {
                name,
                bio,
                skills,     // Prisma handles array directly if configured or pass array
                portfolio,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                portfolio: true,
                isSeller: true,
                sellerStatus: true,
            }
        });

        return NextResponse.json(
            {
                message: 'Profile updated successfully.',
                user: updatedUser,
            },
            { status: HTTP_STATUS.OK }
        );

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
