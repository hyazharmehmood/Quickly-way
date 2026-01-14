// Force recompile
import { NextResponse } from 'next/server';
import { getServiceById, updateService } from '@/lib/controllers/serviceController';
import { getUserId } from '@/lib/controllers/authController';
import { HTTP_STATUS } from '@/lib/shared/constants';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { message: 'Service ID is required' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        const service = await getServiceById(id);

        if (!service) {
            return NextResponse.json(
                { message: 'Service not found' },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        return NextResponse.json(service, { status: HTTP_STATUS.OK });
    } catch (error) {
        console.error('Error fetching service:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Delegate to controller
        const updatedService = await updateService(userId, id, body);

        return NextResponse.json(updatedService, { status: 200 });

    } catch (error) {
        console.error("Error updating service:", error);
        return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
    }
}
