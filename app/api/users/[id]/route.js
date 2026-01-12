import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isSeller: true,
                sellerStatus: true,
                bio: true,
                skills: true,
                portfolio: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        return NextResponse.json(user, { status: HTTP_STATUS.OK });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
