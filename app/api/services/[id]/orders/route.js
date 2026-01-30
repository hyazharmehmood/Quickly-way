import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/services/[id]/orders - Get completed orders for a service
 * This is used to fetch order-based reviews for a service
 */
export async function GET(request, { params }) {
  try {
    const { id: serviceId } = await params;

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get all completed orders for this service
    const orders = await prisma.order.findMany({
      where: {
        serviceId,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        orderNumber: true,
        completedAt: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Error fetching service orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

