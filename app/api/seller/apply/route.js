import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SELLER_STATUS, HTTP_STATUS } from '@/lib/shared/constants';

export async function POST(request) {
    try {
        const { userId, fullName, skills, bio, portfolio } = await request.json();

        // Check if application already exists
        const existingApp = await prisma.sellerApplication.findUnique({
            where: { userId }
        });

        if (existingApp && existingApp.status === SELLER_STATUS.PENDING) {
            return NextResponse.json(
                { message: 'Your application is already pending review.' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        // Upsert application
        const application = await prisma.sellerApplication.upsert({
            where: { userId },
            update: {
                fullName,
                skills,
                bio,
                portfolio,
                status: SELLER_STATUS.PENDING,
                rejectionReason: null,
            },
            create: {
                userId,
                fullName,
                skills,
                bio,
                portfolio,
                status: SELLER_STATUS.PENDING,
            }
        });

        // Update user status
        await prisma.user.update({
            where: { id: userId },
            data: { sellerStatus: SELLER_STATUS.PENDING },
        });

        return NextResponse.json(
            {
                message: 'Application submitted successfully.',
                application,
            },
            { status: HTTP_STATUS.CREATED }
        );
    } catch (error) {
        console.error('Seller apply error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
