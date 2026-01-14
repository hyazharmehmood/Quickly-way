import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { getCurrentUser } from '@/lib/controllers/authController';

export async function GET(request) {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        let token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        const result = await getCurrentUser(token);

        return NextResponse.json(result, { status: HTTP_STATUS.OK });
    } catch (error) {
        console.error('Me route error:', error);

        if (error.message === 'Unauthorized' || error.message === 'Invalid or expired token') {
            return NextResponse.json(
                { message: error.message },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        if (error.message === 'User not found') {
            return NextResponse.json(
                { message: error.message },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
