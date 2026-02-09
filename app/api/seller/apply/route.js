import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { applyAsSeller } from '@/lib/controllers/sellerController';
import { getUserId } from '@/lib/controllers/authController';

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: HTTP_STATUS.UNAUTHORIZED }
            );
        }

        const body = await request.json();
        const { fullName, skills, bio, portfolio } = body;
        if (!fullName || !skills || !Array.isArray(skills)) {
            return NextResponse.json(
                { message: 'fullName and skills (array) are required' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        const result = await applyAsSeller({ userId, fullName, skills: skills.slice(0, 20), bio: bio || null, portfolio: portfolio || null });

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
