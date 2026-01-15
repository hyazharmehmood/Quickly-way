import prisma from '@/lib/prisma';

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(userId1, userId2) {
  // Check if conversation already exists
  // Query through ConversationParticipant to find conversations with both users
  const participantRecords = await prisma.conversationParticipant.findMany({
    where: {
      userId: {
        in: [userId1, userId2],
      },
    },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                  role: true,
                },
              },
            },
          },
          lastMessage: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Group by conversation ID and find conversations with exactly 2 participants
  const conversationsMap = new Map();
  participantRecords.forEach((record) => {
    const convId = record.conversationId;
    if (!conversationsMap.has(convId)) {
      conversationsMap.set(convId, record.conversation);
    }
  });

  // Find conversation with exactly these two participants
  const allConversations = Array.from(conversationsMap.values());
  const existingConversation = allConversations.find((conv) => {
    const participantIds = conv.participants.map((p) => p.userId);
    return (
      participantIds.length === 2 &&
      participantIds.includes(userId1) &&
      participantIds.includes(userId2)
    );
  });

  if (existingConversation) {
    return {
      ...existingConversation,
      otherParticipant: existingConversation.participants.find((p) => p.userId !== userId1)?.user,
    };
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: userId1 },
          { userId: userId2 },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
        },
      },
      lastMessage: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  return {
    ...conversation,
    otherParticipant: conversation.participants.find((p) => p.userId !== userId1)?.user,
  };
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId) {
  // Get all conversation IDs where user is a participant
  const participantRecords = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  const conversationIds = participantRecords.map((p) => p.conversationId);

  if (conversationIds.length === 0) {
    return [];
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      id: {
        in: conversationIds,
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
        },
      },
      lastMessage: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Filter out current user from participants for easier frontend use
  return conversations.map((conv) => ({
    ...conv,
    otherParticipant: conv.participants.find((p) => p.userId !== userId)?.user,
  }));
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(conversationId, userId) {
  // First verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });

  if (!participant) {
    throw new Error('Unauthorized: Not a participant in this conversation');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
        },
      },
      lastMessage: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  return {
    ...conversation,
    otherParticipant: conversation.participants.find((p) => p.userId !== userId)?.user,
  };
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId, userId, page = 1, limit = 50) {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });

  if (!participant) {
    throw new Error('Unauthorized: Not a participant in this conversation');
  }

  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      seenBy: {
        select: {
          userId: true,
          seenAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: limit,
  });

  // Mark messages as read for the current user
  const unreadMessageIds = messages
    .filter((msg) => {
      const isRead = msg.seenBy.some((seen) => seen.userId === userId);
      return !isRead && msg.senderId !== userId;
    })
    .map((msg) => msg.id);

  if (unreadMessageIds.length > 0) {
    await prisma.messageSeen.createMany({
      data: unreadMessageIds.map((messageId) => ({
        messageId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  return messages.reverse(); // Return in chronological order
}

/**
 * Create a message (used by REST API, Socket.IO handles real-time)
 */
export async function createMessage(conversationId, senderId, content) {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: senderId,
      },
    },
  });

  if (!participant) {
    throw new Error('Unauthorized: Not a participant in this conversation');
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderId,
      conversationId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  // Update conversation's last message
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageId: message.id,
      updatedAt: new Date(),
    },
  });

  return message;
}
