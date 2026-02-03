import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import * as orderService from '@/lib/services/orderService';

/**
 * GET /api/admin/disputes/[id] - Get dispute details (admin only)
 */
export async function GET(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            service: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                createdAt: true,
              },
            },
            freelancer: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                createdAt: true,
              },
            },
            deliverables: {
              orderBy: { deliveredAt: 'desc' },
            },
            events: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Fetch resolvedBy user if exists
    let resolvedByUser = null;
    if (dispute.resolvedBy) {
      resolvedByUser = await prisma.user.findUnique({
        where: { id: dispute.resolvedBy },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      dispute: {
        ...dispute,
        resolvedByUser,
      },
    });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dispute' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/disputes/[id] - Update dispute status or resolve (admin only)
 * Body:
 * - status: NEW status (IN_REVIEW, RESOLVED, CLOSED)
 * - adminResolution: Resolution text (required if resolving)
 * - orderAction: Action to take on order (REFUND_CLIENT, PAY_FREELANCER, SPLIT, NONE)
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { status, adminResolution, orderAction } = body;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    const updateData = {};

    if (status) {
      if (!['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;

      // If resolving, require resolution text
      if (status === 'RESOLVED' || status === 'CLOSED') {
        if (!adminResolution || !adminResolution.trim()) {
          return NextResponse.json(
            { error: 'adminResolution is required when resolving a dispute' },
            { status: 400 }
          );
        }
        updateData.adminResolution = adminResolution.trim();
        updateData.resolvedBy = user.id;
        updateData.resolvedAt = new Date();
      }
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            service: {
              select: {
                id: true,
                title: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
            freelancer: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // Fetch resolvedBy user if exists
    let resolvedByUser = null;
    if (updatedDispute.resolvedBy) {
      resolvedByUser = await prisma.user.findUnique({
        where: { id: updatedDispute.resolvedBy },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    // Handle order action if provided
    if (orderAction && (status === 'RESOLVED' || status === 'CLOSED')) {
      // Create order event for dispute resolution
      await prisma.orderEvent.create({
        data: {
          orderId: dispute.orderId,
          userId: user.id,
          eventType: 'DISPUTE_RESOLVED',
          description: `Dispute resolved by admin: ${adminResolution}`,
          metadata: {
            disputeId: id,
            orderAction,
            resolvedBy: user.id,
          },
        },
      });

      // Update order status based on resolution
      let newOrderStatus = 'DISPUTED'; // Default
      
      if (orderAction === 'REFUND_CLIENT') {
        newOrderStatus = 'CANCELLED';
      } else if (orderAction === 'PAY_FREELANCER') {
        newOrderStatus = 'COMPLETED';
      } else if (orderAction === 'SPLIT') {
        // Could be COMPLETED or keep as DISPUTED, depending on business logic
        newOrderStatus = 'COMPLETED';
      }
      // NONE keeps as DISPUTED

      // Update order status
      await prisma.order.update({
        where: { id: dispute.orderId },
        data: {
          status: newOrderStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      dispute: {
        ...updatedDispute,
        resolvedByUser,
      },
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update dispute' },
      { status: 500 }
    );
  }
}

