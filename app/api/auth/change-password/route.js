import { NextResponse } from 'next/server';
import { changePassword, getUserId } from '@/lib/controllers/authController';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function PUT(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        await changePassword(userId, currentPassword, newPassword);

        return NextResponse.json(
            { message: 'Password changed successfully' },
            { status: HTTP_STATUS.OK }
        );
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: error.message === 'Incorrect current password.' ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
