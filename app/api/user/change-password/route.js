import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

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

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: HTTP_STATUS.NOT_FOUND });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Incorrect current password.' },
                { status: HTTP_STATUS.FORBIDDEN }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json(
            { message: 'Password updated successfully.' },
            { status: HTTP_STATUS.OK }
        );

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
