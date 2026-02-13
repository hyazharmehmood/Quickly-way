import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/services/notificationService';
const { emitDisputeCommentEvent } = require('@/lib/socket');

/**
 * GET /api/disputes/[id]/comments - Get all comments for a dispute
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get dispute and verify user has access
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        clientId: true,
        freelancerId: true,
        status: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Verify user is client, freelancer, or admin
    const isClient = dispute.clientId === user.id;
    const isFreelancer = dispute.freelancerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isClient && !isFreelancer && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this dispute' },
        { status: 403 }
      );
    }

    // Get all comments
    const comments = await prisma.disputeComment.findMany({
      where: { disputeId: id },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('Error fetching dispute comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/disputes/[id]/comments - Add a comment to dispute thread
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get dispute and verify user has access
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        clientId: true,
        freelancerId: true,
        status: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Verify user is client, freelancer, or admin
    const isClient = dispute.clientId === user.id;
    const isFreelancer = dispute.freelancerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isClient && !isFreelancer && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this dispute' },
        { status: 403 }
      );
    }

    // Don't allow comments if dispute is resolved or closed
    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Cannot add comments to a resolved or closed dispute' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, attachments } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Determine role
    let role;
    if (isAdmin) {
      role = 'ADMIN';
    } else if (isClient) {
      role = 'CLIENT';
    } else {
      role = 'FREELANCER';
    }

    // Create comment
    const comment = await prisma.disputeComment.create({
      data: {
        disputeId: id,
        userId: user.id,
        role,
        content: content.trim(),
        attachments: attachments || null,
      },
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
    });

    // Real-time: emit to dispute room and user rooms so thread updates instantly
    try {
      emitDisputeCommentEvent(id, comment, {
        clientId: dispute.clientId,
        freelancerId: dispute.freelancerId,
      });
    } catch (socketError) {
      console.error('Failed to emit dispute comment socket event:', socketError);
    }

    // Notify the other party: new dispute comment (client and freelancer; skip if admin posted)
    try {
      const authorName = comment.user?.name || 'Someone';
      const notifyIds = [];
      if (role === 'CLIENT') notifyIds.push(dispute.freelancerId);
      else if (role === 'FREELANCER') notifyIds.push(dispute.clientId);
      else {
        // Admin posted: notify both client and freelancer
        notifyIds.push(dispute.clientId, dispute.freelancerId);
      }
      const notificationBody = role === 'ADMIN'
        ? 'Admin replied on the dispute.'
        : `${authorName} replied on the dispute.`;
      for (const notifyUserId of notifyIds) {
        if (notifyUserId && notifyUserId !== user.id) {
          await createNotification({
            userId: notifyUserId,
            title: 'New dispute comment',
            body: notificationBody,
            type: 'dispute',
            data: { disputeId: id, orderId: dispute.orderId, linkUrl: dispute.orderId ? `/orders/${dispute.orderId}` : `/admin/disputes/${id}` },
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to create dispute comment notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Error creating dispute comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}

