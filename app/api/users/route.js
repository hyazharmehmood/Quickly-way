import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function GET(request) {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isSeller: true,
                sellerStatus: true,
                createdAt: true,
            }
        });

        return NextResponse.json(users, { status: HTTP_STATUS.OK });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
