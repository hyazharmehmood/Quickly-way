import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function GET(request) {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json(
                { message: 'Invalid or expired token' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isSeller: true,
                sellerStatus: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        return NextResponse.json(
            { user },
            { status: HTTP_STATUS.OK }
        );
    } catch (error) {
        console.error('Me route error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
