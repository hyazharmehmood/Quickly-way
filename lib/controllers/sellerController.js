import prisma from '@/lib/prisma';
import { SELLER_STATUS } from '@/lib/shared/constants';

// --- Apply as Seller Logic ---
export async function applyAsSeller(data) {
    const { userId, fullName, skills, bio, portfolio } = data;

    // Check if application already exists
    const existingApp = await prisma.sellerApplication.findUnique({
        where: { userId }
    });

    if (existingApp && existingApp.status === SELLER_STATUS.PENDING) {
        throw new Error('Your application is already pending review.');
    }

    // Upsert application
    const application = await prisma.sellerApplication.upsert({
        where: { userId },
        update: {
            fullName,
            skills,
            bio,
            portfolio,
            status: SELLER_STATUS.PENDING,
            rejectionReason: null,
        },
        create: {
            userId,
            fullName,
            skills,
            bio,
            portfolio,
            status: SELLER_STATUS.PENDING,
        }
    });

    // Update user status
    await prisma.user.update({
        where: { id: userId },
        data: { sellerStatus: SELLER_STATUS.PENDING },
    });

    return application;
}

// --- Get Seller Status Logic ---
export async function getSellerStatus(userId) {
    const application = await prisma.sellerApplication.findUnique({
        where: { userId }
    });

    if (!application) {
        return { status: SELLER_STATUS.NONE, application: null };
    }

    return { status: application.status, application };
}
