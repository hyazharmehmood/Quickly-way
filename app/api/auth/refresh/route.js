import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { refreshSession } from '@/lib/controllers/authController';

export async function POST(request) {
    try {
        const { refreshToken } = await request.json();

        const result = await refreshSession(refreshToken);

        return NextResponse.json(result, { status: HTTP_STATUS.OK });
    } catch (error) {
        console.error('Refresh error:', error);

        if (error.message === 'Refresh token is required' || error.message === 'Invalid refresh token') {
            return NextResponse.json(
                { message: error.message },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
