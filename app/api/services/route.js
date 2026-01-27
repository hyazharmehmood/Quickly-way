import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { createService, getServicesByFreelancer } from '@/lib/controllers/serviceController';

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
console.log("body", body);
        // Delegate business logic to controller
        const result = await createService(userId, body);

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
