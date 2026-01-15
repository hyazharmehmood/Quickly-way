import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { getUserConversations, getOrCreateConversation } from '@/lib/controllers/conversationController';

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

// GET - Get all conversations for the current user
export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const conversations = await getUserConversations(userId);

    return NextResponse.json(
      { conversations },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// POST - Create or get existing conversation with another user
export async function POST(request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { otherUserId } = await request.json();

    if (!otherUserId) {
      return NextResponse.json(
        { message: 'otherUserId is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (userId === otherUserId) {
      return NextResponse.json(
        { message: 'Cannot create conversation with yourself' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const conversation = await getOrCreateConversation(userId, otherUserId);

    return NextResponse.json(
      { conversation },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

