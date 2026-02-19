import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { createService, getServicesByFreelancer } from '@/lib/controllers/serviceController';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/services/notificationService';

// Helper to get user ID from token
async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    return decoded.id;
}

export async function POST(req) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = await createService(userId, body);

        // Notify all admins (real-time)
        try {
            const creator = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true },
            });
            const creatorName = creator?.name || 'A seller';
            const title = 'New service submitted for review';
            const bodyText = `${creatorName} submitted a new service: "${result.title}". Please review and approve or reject.`;
            await Promise.all(
                admins.map((admin) =>
                    createNotification({
                        userId: admin.id,
                        title,
                        body: bodyText,
                        type: 'service_submitted',
                        priority: 'normal',
                        data: { serviceId: result.id, title: result.title },
                    })
                )
            );
        } catch (notifErr) {
            console.error('Failed to send admin notifications for new service:', notifErr);
        }

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error("Error posting service:", error);
        return NextResponse.json({ error: "Failed to post service" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const services = await getServicesByFreelancer(userId);
        return NextResponse.json(services, { status: 200 });
    } catch (error) {
        console.error("Error fetching services:", error);
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }
}
