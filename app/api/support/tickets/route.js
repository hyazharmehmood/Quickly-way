import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getOptionalUser } from '@/lib/utils/supportAuth';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { sendContactSupportEmail } from '@/lib/utils/email';

function generateTicketNo() {
  const year = new Date().getFullYear().toString().slice(-2);
  const time = Date.now().toString().slice(-10);
  return `${year}${time}`;
}

/**
 * POST /api/support/tickets - Create a support ticket (anyone; optional auth)
 * Body: { title, description, fullName, email, attachments?: [{ url, fileName }], createdById?: optional if logged in }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    const createdById = body.createdById || null;

    if (!title || !description || !fullName || !email) {
      return NextResponse.json(
        { success: false, error: 'Title, description, full name and email are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (description.length > 600) {
      return NextResponse.json(
        { success: false, error: 'Description must be 600 characters or less.' },
        { status: 400 }
      );
    }

    const maxAttempts = 5;
    let ticket = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const ticketNo = generateTicketNo();
      try {
        ticket = await prisma.supportTicket.create({
          data: {
            ticketNo,
            title,
            description,
            fullName,
            email,
            createdById: createdById || undefined,
            status: 'OPEN',
            attachments: {
              create: attachments
                .filter((a) => a?.url && a?.fileName)
                .map((a) => ({ fileUrl: a.url, fileName: a.fileName })),
            },
          },
          include: {
            attachments: true,
          },
        });
        break;
      } catch (createError) {
        if (createError?.code === 'P2002') {
          if (attempt === maxAttempts - 1) throw createError;
          continue;
        }
        if (createError?.code === 'P2021' || createError?.code === 'P2022') {
          console.error('Support ticket create DB schema error:', createError?.code, createError?.message);
          return NextResponse.json(
            { success: false, error: 'Support is temporarily unavailable. Please try again in a moment.' },
            { status: 503 }
          );
        }
        throw createError;
      }
    }
    if (!ticket) throw new Error('Failed to create ticket');

    try {
      await sendContactSupportEmail(fullName, email, `[Ticket #${ticket.ticketNo}] ${title}\n\n${description}`);
    } catch (e) {
      console.warn('Support ticket email notification failed:', e);
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        title: ticket.title,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error('Support ticket create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ticket. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/support/tickets - List tickets
 * - Admin: all tickets (query: status, search)
 * - Client: tickets for their email or userId (from token)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const { user: adminUser, error: adminError } = await verifyAdminAuth(request);
    if (!adminError && adminUser) {
      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { ticketNo: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      const tickets = await prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedAgent: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true, attachments: true } },
        },
      });
      return NextResponse.json({ success: true, tickets });
    }

    const { user } = await getOptionalUser(request);
    const baseWhere = user
      ? { OR: [{ createdById: user.id }, { email: user.email }] }
      : { id: 'no-access' };
    if (!user) {
      return NextResponse.json({ success: true, tickets: [] });
    }
    const conditions = [baseWhere];
    if (status) conditions.push({ status });
    if (search) {
      conditions.push({
        OR: [
          { ticketNo: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const where = conditions.length === 1 ? baseWhere : { AND: conditions };

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedAgent: { select: { id: true, name: true } },
        _count: { select: { messages: true, attachments: true } },
      },
    });
    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Support tickets list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load tickets.' },
      { status: 500 }
    );
  }
}
