import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SELLER_STATUS, HTTP_STATUS } from '@/lib/shared/constants';

export async function GET(request, { params }) {
    try {
        const { userId } = await params;

        const application = await prisma.sellerApplication.findUnique({
            where: { userId }
        });

        if (!application) {
            return NextResponse.json(
                { status: SELLER_STATUS.NONE },
                { status: HTTP_STATUS.OK }
            );
        }

        return NextResponse.json(application, { status: HTTP_STATUS.OK });
    } catch (error) {
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
