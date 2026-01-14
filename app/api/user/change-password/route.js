import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { changePassword } from '@/lib/controllers/authController';

export async function PUT(request) {
    try {
        // Auth check
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

        const { currentPassword, newPassword, confirmPassword } = await request.json();

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { message: 'New passwords do not match.' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        // Delegate to controller
        await changePassword(decoded.id, currentPassword, newPassword);

        return NextResponse.json(
            { message: 'Password updated successfully.' },
            { status: HTTP_STATUS.OK }
        );

    } catch (error) {
        console.error('Change password error:', error);

        if (error.message === 'User not found' || error.message === 'Incorrect current password.') {
            // Map specific errors to status codes if needed, or stick to 500/400
            if (error.message === 'User not found') return NextResponse.json({ message: error.message }, { status: HTTP_STATUS.NOT_FOUND });
            if (error.message === 'Incorrect current password.') return NextResponse.json({ message: error.message }, { status: HTTP_STATUS.FORBIDDEN });
        }

        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
