import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SELLER_STATUS, USER_ROLES, HTTP_STATUS } from '@/lib/shared/constants';

export async function PATCH(request, { params }) {
    try {
        const { id: applicationId } = await params;
        const { status, reason } = await request.json();

        if (![SELLER_STATUS.APPROVED, SELLER_STATUS.REJECTED].includes(status)) {
            return NextResponse.json(
                { message: 'Invalid status update.' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        const updateData = { status };
        if (status === SELLER_STATUS.REJECTED) {
            updateData.rejectionReason = reason;
        }

        const application = await prisma.sellerApplication.update({
            where: { id: applicationId },
            data: updateData,
        });

        // Update User model based on status
        const userUpdate = { sellerStatus: status };
        if (status === SELLER_STATUS.APPROVED) {
            userUpdate.isSeller = true;
            userUpdate.role = USER_ROLES.FREELANCER;
        }

        await prisma.user.update({
            where: { id: application.userId },
            data: userUpdate,
        });

        return NextResponse.json(
            {
                message: `Application ${status} successfully.`,
                application,
            },
            { status: HTTP_STATUS.OK }
        );
    } catch (error) {
        // Handle record not found
        if (error.code === 'P2025') {
            return NextResponse.json(
                { message: 'Application not found.' },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}
