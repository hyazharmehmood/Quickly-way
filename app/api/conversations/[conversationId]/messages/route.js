import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

import { getConversationMessages, createMessage } from '@/lib/controllers/conversationController';

// Helper to get user ID from token
async function getUserId() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.id) {
    return null;
  }

  return decoded.id;
}

// GET - Get messages for a conversation
export async function GET(request, { params }) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const messages = await getConversationMessages(conversationId, userId, page, limit);

    return NextResponse.json(
      { messages },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get messages error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { message: error.message },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// POST - Create a message (fallback if Socket.IO is not available)
export async function POST(request, { params }) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { conversationId } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: 'Message content is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const message = await createMessage(conversationId, userId, content.trim());

    return NextResponse.json(
      { message: message },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Create message error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { message: error.message },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

