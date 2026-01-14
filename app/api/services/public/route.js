import { NextResponse } from 'next/server';
import { getAllServices } from '@/lib/controllers/serviceController';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const services = await getAllServices();
        return NextResponse.json(services, { status: 200 });
    } catch (error) {
        console.error("Error fetching public services:", error);
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }
}
