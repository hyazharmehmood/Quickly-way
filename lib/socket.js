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

    // Join conversation room and mark all messages as read
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

        if (!participant) {
          return socket.emit('error', { message: 'Not a participant in this conversation' });
        }

        socket.join(`conversation:${conversationId}`);

        // Mark all messages as read - update participant's lastReadAt and unreadCount
        const now = new Date();
        
        // Get latest message time
        const latestMessage = await prisma.message.findFirst({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        // Always update unreadCount to 0 when conversation is opened
        await prisma.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
          data: {
            lastReadAt: latestMessage?.createdAt || now,
            unreadCount: 0,
          },
        });

        // Notify other participants that messages were read
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            participants: {
              select: { userId: true },
            },
          },
        });

        if (conversation) {
          const otherParticipants = conversation.participants
            .filter((p) => p.userId !== userId)
            .map((p) => p.userId);

          // Emit read receipts to other participants
          otherParticipants.forEach((otherUserId) => {
            if (onlineUsers.has(otherUserId)) {
              const otherUserData = onlineUsers.get(otherUserId);
              io.to(otherUserData.socketId).emit('messages_read', {
                conversationId,
                readerId: userId,
              });
            }
          });
        }

        // Get updated conversation with participants
        const updatedConversation = await prisma.conversation.findUnique({
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
          },
        });

        if (updatedConversation) {
          // Get updated participant with unreadCount (should be 0 now)
          const updatedParticipant = await prisma.conversationParticipant.findUnique({
            where: {
              conversationId_userId: {
                conversationId,
                userId,
              },
            },
          });

          // Always emit conversation:updated to user's personal room with unreadCount: 0
          io.to(`user:${userId}`).emit('conversation:updated', {
            conversation: {
              ...updatedConversation,
              otherParticipant: updatedConversation.participants.find((p) => p.userId !== userId)?.user,
              unreadCount: 0, // Always 0 when conversation is open
              // Format lastMessage for compatibility
              lastMessage: updatedConversation.lastMessageText ? {
                id: 'denormalized',
                content: updatedConversation.lastMessageText,
                senderId: updatedConversation.lastSenderId,
                createdAt: updatedConversation.lastMessageAt,
                sender: updatedConversation.participants.find((p) => p.userId === updatedConversation.lastSenderId)?.user || null,
              } : null,
            },
          });
        }

        socket.emit('joined_conversation', conversationId);
      } catch (error) {
        console.error('Error joining conversation:', error);
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
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        });

        // Mark messages as read - update participant's lastReadAt and unreadCount to 0
        if (messages.length > 0) {
          const latestMessageTime = messages[0].createdAt;
          
          // Update lastReadAt to latest message time and set unreadCount to 0
          await prisma.conversationParticipant.update({
            where: {
              conversationId_userId: {
                conversationId,
                userId,
              },
            },
            data: {
              lastReadAt: latestMessageTime,
              unreadCount: 0,
            },
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

    // Get user's conversations with unread count (OPTIMIZED - using denormalized fields)
    socket.on('get_conversations', async () => {
      try {
        // Get all participant records with unread count (already calculated in DB)
        const participantRecords = await prisma.conversationParticipant.findMany({
          where: { userId },
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
              },
            },
          },
          orderBy: {
            conversation: {
              updatedAt: 'desc',
            },
          },
        });

        // Format conversations with otherParticipant and unreadCount from participant
        const formattedConversations = participantRecords.map((participant) => {
          const conv = participant.conversation;
          return {
            id: conv.id,
            lastMessageText: conv.lastMessageText,
            lastMessageAt: conv.lastMessageAt,
            lastSenderId: conv.lastSenderId,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            participants: conv.participants,
            otherParticipant: conv.participants.find((p) => p.userId !== userId)?.user,
            // Use unreadCount from participant (already calculated in DB)
            unreadCount: participant.unreadCount || 0,
            // Format lastMessage for compatibility
            lastMessage: conv.lastMessageText ? {
              id: 'denormalized',
              content: conv.lastMessageText,
              senderId: conv.lastSenderId,
              createdAt: conv.lastMessageAt,
              sender: conv.participants.find((p) => p.userId === conv.lastSenderId)?.user || null,
            } : null,
          };
        });

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
          },
        });

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Verify user is a participant and get unreadCount
        const participant = conversation.participants.find((p) => p.userId === userId);
        if (!participant) {
          return socket.emit('error', { message: 'Unauthorized: Not a participant in this conversation' });
        }

        const formatted = {
          ...conversation,
          otherParticipant: conversation.participants.find((p) => p.userId !== userId)?.user,
          unreadCount: participant.unreadCount || 0,
          // Format lastMessage for compatibility
          lastMessage: conversation.lastMessageText ? {
            id: 'denormalized',
            content: conversation.lastMessageText,
            senderId: conversation.lastSenderId,
            createdAt: conversation.lastMessageAt,
            sender: conversation.participants.find((p) => p.userId === conversation.lastSenderId)?.user || null,
          } : null,
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
          // Get participant record for unreadCount
          const currentParticipant = participantRecords.find(
            (p) => p.conversationId === existingConversation.id && p.userId === userId
          );
          
          const formatted = {
            ...existingConversation,
            otherParticipant: existingConversation.participants.find((p) => p.userId !== userId)?.user,
            unreadCount: currentParticipant?.unreadCount || 0,
            // Format lastMessage for compatibility
            lastMessage: existingConversation.lastMessageText ? {
              id: 'denormalized',
              content: existingConversation.lastMessageText,
              senderId: existingConversation.lastSenderId,
              createdAt: existingConversation.lastMessageAt,
              sender: existingConversation.participants.find((p) => p.userId === existingConversation.lastSenderId)?.user || null,
            } : null,
          };
          return socket.emit('conversation:created', { conversation: formatted });
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId, unreadCount: 0 },
                { userId: otherUserId, unreadCount: 0 },
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
          },
        });

        const formatted = {
          ...conversation,
          otherParticipant: conversation.participants.find((p) => p.userId !== userId)?.user,
          unreadCount: 0,
          lastMessage: null,
        };

        socket.emit('conversation:created', { conversation: formatted });
      } catch (error) {
        console.error('Error creating conversation:', error);
        socket.emit('error', { message: 'Failed to create conversation' });
      }
    });

    // Send message - OPTIMIZED: Clean event strategy
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content || !content.trim()) {
          return socket.emit('error', { message: 'Missing required fields' });
        }

        // 1️⃣ Verify user is a participant
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

        // 2️⃣ Get all participants
        const allParticipants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
          select: { userId: true },
        });

        // 3️⃣ Create message
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: userId,
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

        const now = new Date();

        // 4️⃣ Update conversation denormalized fields
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageText: content.trim(),
            lastMessageAt: now,
            lastSenderId: userId,
            updatedAt: now,
          },
        });

        // 5️⃣ Update unread counts for all participants
        const participantUpdates = [];
        for (const p of allParticipants) {
          if (p.userId === userId) {
            // Sender: unreadCount = 0
            participantUpdates.push(
              prisma.conversationParticipant.update({
                where: {
                  conversationId_userId: {
                    conversationId,
                    userId: p.userId,
                  },
                },
                data: { unreadCount: 0 },
              })
            );
          } else {
            // Receiver: Check if conversation is open
            const receiverData = onlineUsers.get(p.userId);
            const isConversationOpen = receiverData && 
              io.sockets.adapter.rooms.get(`conversation:${conversationId}`)?.has(receiverData.socketId);

            participantUpdates.push(
              prisma.conversationParticipant.update({
                where: {
                  conversationId_userId: {
                    conversationId,
                    userId: p.userId,
                  },
                },
                data: {
                  unreadCount: isConversationOpen ? 0 : { increment: 1 },
                  lastReadAt: isConversationOpen ? now : undefined,
                },
              })
            );
          }
        }
        await Promise.all(participantUpdates);

        // 6️⃣ Get updated conversation with all participants data
        const updatedConversation = await prisma.conversation.findUnique({
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
          },
        });

        // 7️⃣ Get updated participant records with unreadCount
        const updatedParticipants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
        });

        // 8️⃣ Emit new_message to conversation room (for chat window)
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId,
        });

        // 9️⃣ Emit conversation:updated to EACH USER'S PERSONAL ROOM (for inbox/list)
        // This ensures each user gets their own unreadCount
        for (const p of updatedParticipants) {
          const participantData = updatedParticipants.find(up => up.userId === p.userId);
          
          // Format conversation with participant-specific data
          const formattedConversation = {
            id: updatedConversation.id,
            lastMessageText: updatedConversation.lastMessageText,
            lastMessageAt: updatedConversation.lastMessageAt,
            lastSenderId: updatedConversation.lastSenderId,
            createdAt: updatedConversation.createdAt,
            updatedAt: updatedConversation.updatedAt,
            participants: updatedConversation.participants,
            otherParticipant: updatedConversation.participants.find(part => part.userId !== p.userId)?.user,
            unreadCount: participantData?.unreadCount || 0,
            // Format lastMessage for compatibility
            lastMessage: {
              id: message.id,
              content: message.content,
              senderId: message.senderId,
              createdAt: message.createdAt,
              sender: message.sender,
            },
          };

          // Emit to user's personal room
          io.to(`user:${p.userId}`).emit('conversation:updated', {
            conversation: formattedConversation,
          });
        }

        // 🔟 Update lastActive for sender
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


    // Note: mark_read handler removed - we use ConversationParticipant.unreadCount and lastReadAt instead

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

    // Get order by conversation ID
    socket.on('get_order_by_conversation', async (data) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return socket.emit('error', { message: 'conversationId is required' });
        }

        // Verify user is a participant in the conversation
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

        // Check if Order model is available (Prisma client needs to be regenerated)
        if (!prisma.order) {
          console.error('Prisma Order model not available. Please run: npx prisma generate');
          return socket.emit('error', { 
            message: 'Order system not initialized. Please contact support.' 
          });
        }

        // Get order
        const order = await prisma.order.findFirst({
          where: {
            conversationId,
            OR: [
              { clientId: userId },
              { freelancerId: userId },
            ],
          },
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
            contract: true,
            deliverables: {
              orderBy: { deliveredAt: 'desc' },
              take: 1,
            },
          },
        });

        socket.emit('order:fetched', { order });
      } catch (error) {
        console.error('Error fetching order by conversation:', error);
        if (error.message.includes('Cannot read properties of undefined')) {
          console.error('Prisma Order model not available. Please run: npx prisma generate');
          socket.emit('error', { 
            message: 'Order system not initialized. Please run database migration.' 
          });
        } else {
          socket.emit('error', { message: 'Failed to fetch order' });
        }
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

/**
 * Emit order event to relevant users
 * This should be called from API routes after order operations
 */
const emitOrderEvent = (eventType, order, additionalData = {}) => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit order event');
    return;
  }

  const { clientId, freelancerId, conversationId } = order;

  // Emit to both client and freelancer's personal rooms
  const eventData = {
    order,
    eventType,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  io.to(`user:${clientId}`).emit('order:updated', eventData);
  io.to(`user:${freelancerId}`).emit('order:updated', eventData);

  // Also emit to conversation room if exists
  if (conversationId) {
    io.to(`conversation:${conversationId}`).emit('order:updated', eventData);
  }

  console.log(`📦 Order event emitted: ${eventType} for order ${order.id}`);
};

module.exports = { 
  initSocket, 
  getIO, 
  isUserOnline, 
  getOnlineUser, 
  getOnlineUsers,
  emitOrderEvent,
};
