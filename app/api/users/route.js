import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { getAllUsers } from '@/lib/controllers/adminController';

export async function GET(request) {
    try {
        const users = await getAllUsers();
        return NextResponse.json(users, { status: HTTP_STATUS.OK });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
