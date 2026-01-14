import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { getSellerRequests } from '@/lib/controllers/adminController';

export async function GET(request) {
    try {
        const transformedApplications = await getSellerRequests();
        return NextResponse.json(transformedApplications, { status: HTTP_STATUS.OK });
    } catch (error) {
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
