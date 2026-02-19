import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOptionalUser } from '@/lib/utils/supportAuth';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
const { emitSupportTicketMessageEvent } = require('@/lib/socket');

function getMessageRole(user, ticket) {
  if (!user) return null;
  if (user.role === 'ADMIN') {
    return ticket.assignedAgentId === user.id ? 'AGENT' : 'ADMIN';
  }
  return 'CLIENT';
}

/**
 * POST /api/support/tickets/[id]/messages - Add a message to the ticket
 * Body: { content, attachments?: [{ url, name, type }] }
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Ticket ID required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, createdById: true, email: true, assignedAgentId: true },
    });
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    if (!content && attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message content or attachments required.' },
        { status: 400 }
      );
    }

    const { user: adminUser, error: adminError } = await verifyAdminAuth(request);
    let senderId = null;
    let role = null;

    if (!adminError && adminUser) {
      senderId = adminUser.id;
      role = ticket.assignedAgentId === adminUser.id ? 'AGENT' : 'ADMIN';
    } else {
      const { user } = await getOptionalUser(request);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'You must be logged in or provide ticket access to reply.' },
          { status: 401 }
        );
      }
      const isOwner = ticket.createdById === user.id || ticket.email === user.email;
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Not allowed to reply to this ticket.' },
          { status: 403 }
        );
      }
      senderId = user.id;
      role = 'CLIENT';
    }

    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        senderId,
        role,
        content: content || ' ',
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, profileImage: true } },
      },
    });

    try {
      emitSupportTicketMessageEvent(id, message, {
        createdById: ticket.createdById,
        assignedAgentId: ticket.assignedAgentId,
      });
    } catch (socketError) {
      console.error('Failed to emit support ticket message socket event:', socketError);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Support ticket message error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message.' },
      { status: 500 }
    );
  }
}
