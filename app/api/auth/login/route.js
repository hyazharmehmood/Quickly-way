import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { loginUser } from '@/lib/controllers/authController';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        const result = await loginUser(email, password);

        return NextResponse.json(result, { status: HTTP_STATUS.OK });
    } catch (error) {
        console.error('Login error:', error);

        if (error.message === 'Invalid email or password.') {
            return NextResponse.json(
                { message: error.message },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
