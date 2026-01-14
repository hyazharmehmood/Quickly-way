import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { registerUser } from '@/lib/controllers/userController';

export async function POST(request) {
    try {
        const body = await request.json();

        // Delegate logic to controller
        const result = await registerUser(body);

        return NextResponse.json(result, { status: HTTP_STATUS.CREATED });
    } catch (error) {
        console.error('Signup error:', error);

        // Handle specific business logic errors
        if (error.message === 'A user with this email already exists.') {
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
