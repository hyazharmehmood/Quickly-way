import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOptionalUser } from '@/lib/utils/supportAuth';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';

/**
 * GET /api/support/tickets/[id] - Get one ticket with messages
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Ticket ID required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        attachments: true,
        assignedAgent: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const { user: adminUser, error: adminError } = await verifyAdminAuth(request);
    if (!adminError && adminUser) {
      return NextResponse.json({ success: true, ticket });
    }

    const { user } = await getOptionalUser(request);
    const canAccess =
      user &&
      (ticket.createdById === user.id || ticket.email === user.email);
    if (!canAccess) {
      return NextResponse.json({ success: false, error: 'Not allowed to view this ticket' }, { status: 403 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Support ticket get error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load ticket.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/support/tickets/[id] - Update ticket (admin: assign agent, status)
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await verifyAdminAuth(request);
    if (error) return error;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Ticket ID required' }, { status: 400 });
    }

    const body = await request.json();
    const assignedAgentId = body.assignedAgentId !== undefined ? body.assignedAgentId : undefined;
    const status = body.status !== undefined ? body.status : undefined;

    const data = {};
    if (assignedAgentId !== undefined) data.assignedAgentId = assignedAgentId || null;
    if (status !== undefined) {
      if (!['OPEN', 'AGENT_ASSIGNED', 'RESOLVED'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }
      data.status = status;
    }
    if (assignedAgentId && !data.status) data.status = 'AGENT_ASSIGNED';

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }
    console.error('Support ticket update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket.' },
      { status: 500 }
    );
  }
}
