import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { getSellerStatus } from '@/lib/controllers/sellerController';

export async function GET(request, { params }) {
    try {
        const { userId } = await params;

        const result = await getSellerStatus(userId);

        if (!result.application) {
            return NextResponse.json(
                { status: result.status },
                { status: HTTP_STATUS.OK }
            );
        }

        return NextResponse.json(result.application, { status: HTTP_STATUS.OK });
    } catch (error) {
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
