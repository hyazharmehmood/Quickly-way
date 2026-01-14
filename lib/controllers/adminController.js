import prisma from '@/lib/prisma';

// --- Get All Users ---
export async function getAllUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSeller: true,
            sellerStatus: true,
            createdAt: true,
        }
    });

    return users;
}

// --- Get Seller Requests ---
export async function getSellerRequests() {
    const applications = await prisma.sellerApplication.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        }
    });

    // Transform to flat structure with populated user info if needed, or return as is.
    // Preserving logic from original route:
    const transformed = applications.map(app => ({
        ...app,
        userId: app.user // mimic populate behavior roughly
    }));

    return transformed;
}
