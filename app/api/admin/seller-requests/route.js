import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function GET(request) {
    try {
        const applications = await prisma.sellerApplication.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        // Transform if needed to match frontend expectation (populate puts user object in userId usually in mongoose, here it's in user property)
        // Assuming frontend can handle nested object or we map it.
        // Let's keep it structurally similar:
        const transformed = applications.map(app => ({
            ...app,
            userId: app.user // mimic populate behavior roughly
        }));

        return NextResponse.json(transformed, { status: HTTP_STATUS.OK });
    } catch (error) {
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
