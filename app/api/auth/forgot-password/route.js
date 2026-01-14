import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/utils/email';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function POST(request) {
    try {
        const { email } = await request.json();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Check security best practices: maybe don't reveal user doesn't exist. 
            // But for now keeping consistent with old behavior or standard 404
            return NextResponse.json(
                { message: 'User not found.' },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save to DB
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken,
                passwordResetExpires,
            },
        });

        // Send email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const resetURL = `${appUrl}/reset-password/${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, resetURL, user.name);

            return NextResponse.json(
                { message: 'Token sent to email!' },
                { status: HTTP_STATUS.OK }
            );
        } catch (err) {
            // Revert changes if email fails
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: null,
                    passwordResetExpires: null,
                },
            });
            throw new Error('There was an error sending the email. Try again later!');
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
