import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { updateUserProfile } from '@/lib/controllers/userController';

export async function PUT(request) {
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ message: 'Invalid token' }, { status: HTTP_STATUS.UNAUTHORIZED });
        }

        const body = await request.json();

        // Delegate to controller
        const updatedUser = await updateUserProfile(decoded.id, body);

        return NextResponse.json(
            {
                message: 'Profile updated successfully.',
                user: updatedUser,
            },
            { status: HTTP_STATUS.OK }
        );

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
