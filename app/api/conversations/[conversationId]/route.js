import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';
import { getConversationById } from '@/lib/controllers/conversationController';

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

// GET - Get a single conversation
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
    const conversation = await getConversationById(conversationId, userId);

    return NextResponse.json(
      { conversation },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get conversation error:', error);
    
    if (error.message === 'Conversation not found') {
      return NextResponse.json(
        { message: error.message },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

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

