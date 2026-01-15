const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt.cjs');
const prisma = require('./prisma.cjs');

let io = null;

// Global online users map: userId => { socketId, role, lastActive, chattingWith }
const onlineUsers = new Map();


// Timeout for inactive users (30 seconds - slightly more than heartbeat)
const INACTIVE_TIMEOUT = 30000;

const initSocket = (server) => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
        : true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    // Don't interfere with other routes
    serveClient: false,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return next(new Error('Authentication error: Invalid token'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true, profileImage: true },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Broadcast presence update to all connected clients
  const broadcastPresenceUpdate = () => {
    const onlineList = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));
    
    io.emit('presence:update', {
      onlineUsers: onlineList,
      timestamp: new Date().toISOString(),
    });
  };

  // Remove inactive users (heartbeat timeout)
  const cleanupInactiveUsers = () => {
    const now = Date.now();
    const toRemove = [];

    onlineUsers.forEach((data, userId) => {
      if (now - data.lastActive > INACTIVE_TIMEOUT) {
        toRemove.push(userId);
      }
    });

    toRemove.forEach((userId) => {
      onlineUsers.delete(userId);
      console.log(`🧹 Removed inactive user: ${userId}`);
    });

    if (toRemove.length > 0) {
      broadcastPresenceUpdate();
    }
  };

  // Run cleanup every 30 seconds
  setInterval(cleanupInactiveUsers, 30000);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const now = Date.now();

    // Add user to online map
    onlineUsers.set(userId, {
      socketId: socket.id,
      role: socket.user.role,
      lastActive: now,
      chattingWith: null,
    });

    console.log(`✅ Socket.IO: User ${userId} (${socket.user.name}) connected`, {
      socketId: socket.id,
      transport: socket.conn.transport.name,
      role: socket.user.role,
      totalOnline: onlineUsers.size,
    });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send initial presence update
    broadcastPresenceUpdate();

    // Send current user their own online status
    socket.emit('presence:connected', {
      userId,
      onlineUsers: Array.from(onlineUsers.entries()).map(([uid, data]) => ({
        userId: uid,
        ...data,
      })),
    });

    // Heartbeat handler - update lastActive
    socket.on('heartbeat', () => {
      const userData = onlineUsers.get(userId);
      if (userData) {
        userData.lastActive = Date.now();
        onlineUsers.set(userId, userData);
      }
    });

    // Chat focus - user is actively chatting with someone
    socket.on('chat:focus', async (data) => {
      try {
        const { partnerId } = data;
        
        if (!partnerId) {
          return socket.emit('error', { message: 'partnerId is required' });
        }

        // Verify conversation exists between users
        const participantRecords = await prisma.conversationParticipant.findMany({
          where: {
            userId: { in: [userId, partnerId] },
          },
          include: {
            conversation: {
              include: {
                participants: {
                  select: { userId: true },
                },
              },
            },
          },
        });

        const conversationExists = participantRecords.some((record) => {
          const participantIds = record.conversation.participants.map((p) => p.userId);
          return (
            participantIds.length === 2 &&
            participantIds.includes(userId) &&
            participantIds.includes(partnerId)
          );
        });

        if (!conversationExists) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Update chattingWith
        const userData = onlineUsers.get(userId);
        if (userData) {
          userData.chattingWith = partnerId;
          userData.lastActive = Date.now();
          onlineUsers.set(userId, userData);
        }

        // Notify partner
        io.to(`user:${partnerId}`).emit('presence:update', {
          onlineUsers: Array.from(onlineUsers.entries()).map(([uid, data]) => ({
            userId: uid,
            ...data,
          })),
        });

        broadcastPresenceUpdate();
        console.log(`💬 User ${userId} is now chatting with ${partnerId}`);
      } catch (error) {
        console.error('Error handling chat:focus:', error);
        socket.emit('error', { message: 'Failed to set chat focus' });
      }
    });

    // Chat blur - user left chat
    socket.on('chat:blur', () => {
      const userData = onlineUsers.get(userId);
      if (userData) {
        const previousPartner = userData.chattingWith;
        userData.chattingWith = null;
        userData.lastActive = Date.now();
        onlineUsers.set(userId, userData);

        // Notify previous partner if they exist
        if (previousPartner) {
          io.to(`user:${previousPartner}`).emit('presence:update', {
            onlineUsers: Array.from(onlineUsers.entries()).map(([uid, data]) => ({
              userId: uid,
              ...data,
            })),
          });
        }

        broadcastPresenceUpdate();
        console.log(`💬 User ${userId} left chat`);
      }
    });

    // Join conversation room
    socket.on('join_conversation', async (conversationId) => {
      try {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (participant) {
          socket.join(`conversation:${conversationId}`);
          socket.emit('joined_conversation', conversationId);
        } else {
          socket.emit('error', { message: 'Not a participant in this conversation' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left_conversation', conversationId);
    });

    // Fetch messages for a conversation
    socket.on('fetch_messages', async (data) => {
      try {
        const { conversationId, page = 1, limit = 50 } = data;

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
          return socket.emit('error', { message: 'Not a participant in this conversation' });
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

        // Return in chronological order
        socket.emit('messages:fetched', {
          conversationId,
          messages: messages.reverse(),
          page,
          hasMore: messages.length === limit,
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        socket.emit('error', { message: 'Failed to fetch messages' });
      }
    });

    // Get user's conversations
    socket.on('get_conversations', async () => {
      try {
        // Get all conversation IDs where user is a participant
        const participantRecords = await prisma.conversationParticipant.findMany({
          where: { userId },
          select: { conversationId: true },
        });

        const conversationIds = participantRecords.map((p) => p.conversationId);

        if (conversationIds.length === 0) {
          return socket.emit('conversations:fetched', { conversations: [] });
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

        // Format conversations with otherParticipant
        const formattedConversations = conversations.map((conv) => ({
          ...conv,
          otherParticipant: conv.participants.find((p) => p.userId !== userId)?.user,
        }));

        socket.emit('conversations:fetched', { conversations: formattedConversations });
      } catch (error) {
        console.error('Error fetching conversations:', error);
        socket.emit('error', { message: 'Failed to fetch conversations' });
      }
    });

    // Get a single conversation by ID
    socket.on('get_conversation', async (data) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return socket.emit('error', { message: 'conversationId is required' });
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
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Verify user is a participant
        const isParticipant = conversation.participants.some((p) => p.userId === userId);
        if (!isParticipant) {
          return socket.emit('error', { message: 'Unauthorized: Not a participant in this conversation' });
        }

        const formatted = {
          ...conversation,
          otherParticipant: conversation.participants.find((p) => p.userId !== userId)?.user,
        };

        socket.emit('conversation:fetched', { conversation: formatted });
        console.log(`Fetched conversation ${conversationId} for user ${userId}`);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        socket.emit('error', { message: 'Failed to fetch conversation' });
      }
    });

    // Create or get conversation
    socket.on('create_conversation', async (data) => {
      try {
        const { otherUserId } = data;

        if (!otherUserId) {
          return socket.emit('error', { message: 'otherUserId is required' });
        }

        if (userId === otherUserId) {
          return socket.emit('error', { message: 'Cannot create conversation with yourself' });
        }

        // Check if conversation already exists
        const participantRecords = await prisma.conversationParticipant.findMany({
          where: {
            userId: {
              in: [userId, otherUserId],
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

        // Group by conversation ID
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
            participantIds.includes(userId) &&
            participantIds.includes(otherUserId)
          );
        });

        if (existingConversation) {
          const formatted = {
            ...existingConversation,
            otherParticipant: existingConversation.participants.find((p) => p.userId !== userId)?.user,
          };
          return socket.emit('conversation:created', { conversation: formatted });
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId },
                { userId: otherUserId },
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

        const formatted = {
          ...conversation,
          otherParticipant: conversation.participants.find((p) => p.userId !== userId)?.user,
        };

        socket.emit('conversation:created', { conversation: formatted });
      } catch (error) {
        console.error('Error creating conversation:', error);
        socket.emit('error', { message: 'Failed to create conversation' });
      }
    });

    // Send message with smart delivery
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;

        if (!content || !conversationId) {
          return socket.emit('error', { message: 'Missing required fields' });
        }

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
          return socket.emit('error', { message: 'Not a participant in this conversation' });
        }

        // Get all participants
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content,
            senderId: userId,
            conversationId,
            isRead: false, // Will be updated based on online status
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

        // Smart delivery: Check if receiver is online
        const receiverId = participants.find((p) => p.userId !== userId)?.userId;
        const receiverOnline = receiverId && onlineUsers.has(receiverId);

        if (receiverOnline) {
          // Instant delivery via socket
          const receiverData = onlineUsers.get(receiverId);
          io.to(receiverData.socketId).emit('new_message', {
            message,
            conversationId,
          });

          // Mark as read if receiver is actively chatting
          if (receiverData.chattingWith === userId) {
            await prisma.messageSeen.create({
              data: {
                messageId: message.id,
                userId: receiverId,
              },
            });
            message.isRead = true;
          }
        } else {
          // Offline - message stored in DB, will be marked unread
          // Frontend will fetch unread messages on next connection
        }

        // Emit to sender (confirmation)
        socket.emit('message:sent', {
          message,
          conversationId,
          delivered: receiverOnline,
        });

        // Emit to conversation room (for other participants who might be viewing)
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId,
        });

        // Update lastActive
        const userData = onlineUsers.get(userId);
        if (userData) {
          userData.lastActive = Date.now();
          onlineUsers.set(userId, userData);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark message as read
    socket.on('mark_read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (!participant) {
          return socket.emit('error', { message: 'Not a participant in this conversation' });
        }

        const existing = await prisma.messageSeen.findUnique({
          where: {
            messageId_userId: {
              messageId,
              userId,
            },
          },
        });

        if (!existing) {
          await prisma.messageSeen.create({
            data: {
              messageId,
              userId,
            },
          });

          io.to(`conversation:${conversationId}`).emit('message_read', {
            messageId,
            userId,
            conversationId,
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Typing indicator
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;

        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        });

        if (participant) {
          socket.to(`conversation:${conversationId}`).emit('user_typing', {
            userId,
            userName: socket.user.name,
            conversationId,
            isTyping,
          });
        }
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket.IO: User ${userId} disconnected`, {
        reason,
        socketId: socket.id,
      });

      // Remove from online users
      onlineUsers.delete(userId);
      
      // Broadcast presence update
      broadcastPresenceUpdate();

      console.log(`📊 Online users: ${onlineUsers.size}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

// Helper to check if user is online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Helper to get online user data
const getOnlineUser = (userId) => {
  return onlineUsers.get(userId) || null;
};

// Helper to get all online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.entries()).map(([userId, data]) => ({
    userId,
    ...data,
  }));
};

module.exports = { initSocket, getIO, isUserOnline, getOnlineUser, getOnlineUsers };
