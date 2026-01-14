import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { applyAsSeller } from '@/lib/controllers/sellerController';

export async function POST(request) {
    try {
        const body = await request.json();

        const result = await applyAsSeller(body);

        return NextResponse.json(
            {
                message: 'Application submitted successfully.',
                application: result,
            },
            { status: HTTP_STATUS.CREATED }
        );
    } catch (error) {
        console.error('Seller apply error:', error);

        if (error.message === 'Your application is already pending review.') {
            return NextResponse.json(
                { message: error.message },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
