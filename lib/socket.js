const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt.cjs');
const prisma = require('./prisma.cjs');
const presence = require('./presence');

let io = null;


// NOTE: Removed INACTIVE_TIMEOUT - users are online when socket connected, offline when disconnected

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
        select: { id: true, name: true, email: true, role: true, profileImage: true, isSeller: true, sellerStatus: true },
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

  // ============================================================================
  // PUBLIC PRESENCE NAMESPACE - No authentication required
  // ============================================================================
  // This namespace allows guest users to see freelancer online status
  // Only sends freelancer userIds (no private data like socketId, chattingWith, etc.)
  const publicNamespace = io.of('/presence');
  
  publicNamespace.on('connection', (socket) => {
    const onlineIds = presence.getOnlineFreelancerIds();
    // Send initial freelancer list to connecting guest
    socket.emit('presence:connected', {
      onlineFreelancerIds: onlineIds,
      timestamp: new Date().toISOString(),
    });
    console.log(`👀 Guest connected to /presence - sent ${onlineIds.length} online freelancer(s)`);
    socket.on('disconnect', () => {
      // Guest disconnected - no action needed
    });
  });

  // Broadcast presence update to all connected clients (authenticated)
  const broadcastPresenceUpdate = () => {
    const onlineList = presence.getOnlineUsers();
    
    io.emit('presence:update', {
      onlineUsers: onlineList,
      timestamp: new Date().toISOString(),
    });
  };

  // Broadcast public presence update (freelancers only, no private data)
  const broadcastPublicPresenceUpdate = () => {
    publicNamespace.emit('presence:update', {
      onlineFreelancerIds: presence.getOnlineFreelancerIds(),
      timestamp: new Date().toISOString(),
    });
  };

  // NOTE: Removed inactive cleanup - users are only online when socket is connected
  // When socket disconnects, user is immediately removed from onlineUsers

  // ============================================================================
  // AUTHENTICATED NAMESPACE - JWT authentication required
  // ============================================================================
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const now = Date.now();

    // Add user to online map (multi-device: same user can have multiple sockets)
    presence.addUser(userId, socket.id, {
      role: socket.user.role,
      isSeller: socket.user.isSeller ?? false,
      sellerStatus: socket.user.sellerStatus || null,
    });

    console.log(`✅ Socket.IO: User ${userId} (${socket.user.name}) connected`, {
      socketId: socket.id,
      transport: socket.conn.transport.name,
      role: socket.user.role,
      totalOnline: presence.getOnlineUsers().length,
    });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send initial presence update to authenticated clients
    broadcastPresenceUpdate();
    
    // Send initial public presence update (freelancers only)
    broadcastPublicPresenceUpdate();

    // Send current user their own online status
    socket.emit('presence:connected', {
      userId,
      onlineUsers: presence.getOnlineUsers(),
    });

    // Heartbeat handler - update lastActive
    socket.on('heartbeat', () => {
      presence.updateUserData(userId, { lastActive: Date.now() });
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
        presence.updateUserData(userId, {
          chattingWith: partnerId,
          lastActive: Date.now(),
        });

        // Notify partner
        io.to(`user:${partnerId}`).emit('presence:update', {
          onlineUsers: presence.getOnlineUsers(),
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
      const userData = presence.getOnlineUser(userId);
      if (userData) {
        const previousPartner = userData.chattingWith;
        presence.updateUserData(userId, {
          chattingWith: null,
          lastActive: Date.now(),
        });

        // Notify previous partner if they exist
        if (previousPartner) {
          io.to(`user:${previousPartner}`).emit('presence:update', {
            onlineUsers: presence.getOnlineUsers(),
          });
        }

        broadcastPresenceUpdate();
        console.log(`💬 User ${userId} left chat`);
      }
    });

    // Order detail real-time: join room when viewing an order
    socket.on('order:subscribe', (data) => {
      const orderId = data?.orderId;
      if (orderId && typeof orderId === 'string') {
        socket.join(`order:${orderId}`);
      }
    });

    // Order detail real-time: leave room when leaving order page
    socket.on('order:unsubscribe', (data) => {
      const orderId = data?.orderId;
      if (orderId && typeof orderId === 'string') {
        socket.leave(`order:${orderId}`);
      }
    });

    // Dispute thread real-time: join room when viewing dispute
    socket.on('dispute:subscribe', (data) => {
      const disputeId = data?.disputeId;
      if (disputeId && typeof disputeId === 'string') {
        socket.join(`dispute:${disputeId}`);
      }
    });

    socket.on('dispute:unsubscribe', (data) => {
      const disputeId = data?.disputeId;
      if (disputeId && typeof disputeId === 'string') {
        socket.leave(`dispute:${disputeId}`);
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
        socket.emit('joined_conversation', conversationId);

        // Run heavy DB updates in background (user doesn't wait for these)
        setImmediate(async () => {
          try {
            const now = new Date();
            await prisma.message.updateMany({
              where: {
                conversationId,
                senderId: { not: userId },
                deliveredAt: null,
              },
              data: { deliveredAt: now },
            });

            const latestMessage = await prisma.message.findFirst({
              where: { conversationId },
              orderBy: { createdAt: 'desc' },
              select: { createdAt: true },
            });

            const updateResult = await prisma.conversationParticipant.update({
              where: {
                conversationId_userId: { conversationId, userId },
              },
              data: {
                lastReadAt: latestMessage?.createdAt || now,
                unreadCount: 0,
              },
            });

            if (latestMessage && updateResult.lastReadAt) {
              await prisma.message.updateMany({
                where: {
                  conversationId,
                  senderId: { not: userId },
                  createdAt: { lte: updateResult.lastReadAt },
                  seenAt: null,
                },
                data: { seenAt: updateResult.lastReadAt },
              });
            }

            io.to(`user:${userId}`).emit('messages_read', { conversationId, unreadCount: 0 });

            const conversationData = await prisma.conversation.findUnique({
              where: { id: conversationId },
              include: { participants: { select: { userId: true } } },
            });

            if (conversationData) {
              conversationData.participants
                .filter((p) => p.userId !== userId)
                .forEach((p) => {
                  if (presence.isUserOnline(p.userId)) {
                    io.to(`user:${p.userId}`).emit('messages_read', {
                      conversationId,
                      readerId: userId,
                    });
                  }
                });
            }
          } catch (err) {
            console.error('Background join_conversation updates failed:', err);
          }
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        const msg = error?.code === 'P1001' ? 'Database unavailable. Please try again in a moment.' : 'Failed to join conversation';
        socket.emit('error', { message: msg });
      }
    });

    // Leave conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left_conversation', conversationId);
    });

    // Fetch messages for a conversation (OPTIMIZED: parallel queries, emit first then mark read)
    socket.on('fetch_messages', async (data) => {
      try {
        const { conversationId, page = 1, limit = 50 } = data;
        const skip = (page - 1) * limit;

        // Run participant check and message query in PARALLEL for speed
        const [participant, messages] = await Promise.all([
          prisma.conversationParticipant.findUnique({
            where: {
              conversationId_userId: { conversationId, userId },
            },
          }),
          prisma.message.findMany({
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
            offer: {
              select: {
                id: true,
                serviceId: true,
                clientId: true,
                freelancerId: true,
                conversationId: true,
                status: true,
                price: true,
                currency: true,
                deliveryTime: true,
                revisionsIncluded: true,
                scopeOfWork: true,
                cancellationPolicy: true,
                serviceTitle: true,
                serviceDescription: true,
                rejectionReason: true,
                rejectedAt: true,
                acceptedAt: true,
                orderId: true,
                createdAt: true,
                updatedAt: true,
                service: {
                  select: {
                    id: true,
                    title: true,
                    images: true,
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
                order: true,
              },
            },
            order: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ]);

        if (!participant) {
          return socket.emit('error', { message: 'Not a participant in this conversation' });
        }

        // EMIT FIRST - user sees messages immediately, then mark-as-read in background
        socket.emit('messages:fetched', {
          conversationId,
          messages: messages.reverse(),
          page,
          hasMore: messages.length === limit,
        });

        // Mark as read in background (non-blocking)
        if (messages.length > 0) {
          const latestMessageTime = messages[0].createdAt;
          setImmediate(async () => {
            try {
              const updateResult = await prisma.conversationParticipant.update({
                where: {
                  conversationId_userId: { conversationId, userId },
                },
                data: {
                  lastReadAt: latestMessageTime,
                  unreadCount: 0,
                },
              });
              await prisma.message.updateMany({
                where: {
                  conversationId,
                  senderId: { not: userId },
                  createdAt: { lte: updateResult.lastReadAt },
                  seenAt: null,
                },
                data: { seenAt: updateResult.lastReadAt },
              });
            } catch (err) {
              console.error('Background mark-as-read failed:', err);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        const msg = error?.code === 'P1001' ? 'Database unavailable. Please try again in a moment.' : 'Failed to fetch messages';
        socket.emit('error', { message: msg });
      }
    });

    // Get user's conversations with unread count (OPTIMIZED - using denormalized fields)
    // Only show conversations that have at least one message (so "Contact" without messaging doesn't show for the other user)
    socket.on('get_conversations', async () => {
      try {
        const participantRecords = await prisma.conversationParticipant.findMany({
          where: {
            userId,
            conversation: {
              lastMessageAt: { not: null },
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
          orderBy: {
            conversation: {
              lastMessageAt: 'desc', // Use lastMessageAt for ordering (only moves to top when message is sent)
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
            // Format lastMessage with status tracking
            lastMessage: conv.lastMessageText ? {
              id: 'denormalized',
              content: conv.lastMessageText,
              senderId: conv.lastSenderId,
              createdAt: conv.lastMessageAt,
              deliveredAt: null, // Will be populated from actual message if needed
              seenAt: null, // Will be populated from actual message if needed
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

        // Get actual last message with status tracking
        const actualLastMessage = conversation.lastMessageText ? await prisma.message.findFirst({
          where: {
            conversationId,
            content: conversation.lastMessageText,
            createdAt: conversation.lastMessageAt,
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
          orderBy: { createdAt: 'desc' },
        }) : null;

        const formatted = {
          ...conversation,
          otherParticipant: conversation.participants.find((p) => p.userId !== userId)?.user,
          unreadCount: participant.unreadCount || 0, // ALWAYS from ConversationParticipant.unreadCount
          // Format lastMessage with status tracking
          lastMessage: actualLastMessage || (conversation.lastMessageText ? {
            id: 'denormalized',
            content: conversation.lastMessageText,
            senderId: conversation.lastSenderId,
            createdAt: conversation.lastMessageAt,
            deliveredAt: null,
            seenAt: null,
            sender: conversation.participants.find((p) => p.userId === conversation.lastSenderId)?.user || null,
          } : null),
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
          
          // Get actual last message with status tracking
          const actualLastMessage = existingConversation.lastMessageText ? await prisma.message.findFirst({
            where: {
              conversationId: existingConversation.id,
              content: existingConversation.lastMessageText,
              createdAt: existingConversation.lastMessageAt,
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
            orderBy: { createdAt: 'desc' },
          }) : null;

          const formatted = {
            ...existingConversation,
            otherParticipant: existingConversation.participants.find((p) => p.userId !== userId)?.user,
            unreadCount: currentParticipant?.unreadCount || 0, // ALWAYS from ConversationParticipant.unreadCount
            // Format lastMessage with status tracking
            lastMessage: actualLastMessage || (existingConversation.lastMessageText ? {
              id: 'denormalized',
              content: existingConversation.lastMessageText,
              senderId: existingConversation.lastSenderId,
              createdAt: existingConversation.lastMessageAt,
              deliveredAt: null,
              seenAt: null,
              sender: existingConversation.participants.find((p) => p.userId === existingConversation.lastSenderId)?.user || null,
            } : null),
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
        const { conversationId, content, type, attachmentUrl, attachmentName } = data;

        // Validate: must have either content, attachment, or offer ID
        if (!conversationId || (!content?.trim() && !attachmentUrl && !(type === 'offer' && attachmentName))) {
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

        const now = new Date();

        // 3️⃣ Check recipient online status for deliveredAt tracking
        const recipient = allParticipants.find(p => p.userId !== userId);
        const recipientData = recipient ? presence.getOnlineUser(recipient.userId) : null;
        const isRecipientOnline = !!recipientData;
        
        // 4️⃣ Create message with deliveredAt if recipient is online
        // For offer messages: set offerId for optimized fetch (attachmentName = offer ID)
        const offerIdForMessage = type === 'offer' && attachmentName ? attachmentName : null;
        const message = await prisma.message.create({
          data: {
            content: content?.trim() || '',
            senderId: userId,
            conversationId,
            type: type || 'text', // 'text', 'image', 'video', 'file', 'offer'
            attachmentUrl: attachmentUrl || null,
            attachmentName: attachmentName || null,
            offerId: offerIdForMessage, // Direct relation for optimized chat fetch
            deliveredAt: isRecipientOnline ? now : null, // Mark as delivered if recipient is online
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

        // 5️⃣ Update conversation denormalized fields - lastMessageAt used for ordering
        // For attachments, use a preview text
        const lastMessagePreview = type === 'offer'
          ? '💼 Custom Offer'
          : type === 'image' 
          ? '📷 Image' 
          : type === 'video' 
            ? '🎥 Video' 
            : type === 'file' 
              ? `📎 ${attachmentName || 'File'}` 
              : content.trim();
        
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageText: lastMessagePreview,
            lastMessageAt: now, // Used for conversation ordering (moves to top when message sent)
            lastSenderId: userId,
            updatedAt: now, // Also update updatedAt for consistency
          },
        });

        // 6️⃣ Update unread counts for all participants (ALWAYS from ConversationParticipant)
        const participantUpdates = [];
        for (const p of allParticipants) {
          if (p.userId === userId) {
            // Sender: unreadCount = 0 (always)
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
            const receiverData = presence.getOnlineUser(p.userId);
            const convRoom = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
            const isConversationOpen = receiverData && receiverData.socketIds?.some((sid) => convRoom?.has(sid));

            // Update seenAt if conversation is open (message is immediately seen)
            if (isConversationOpen) {
              // Mark message as seen if conversation is open
              await prisma.message.update({
                where: { id: message.id },
                data: { seenAt: now },
              });
            }

            participantUpdates.push(
              prisma.conversationParticipant.update({
                where: {
                  conversationId_userId: {
                    conversationId,
                    userId: p.userId,
                  },
                },
                data: {
                  unreadCount: isConversationOpen ? 0 : { increment: 1 }, // ALWAYS from ConversationParticipant
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

        // 7️⃣ Get updated participant records with unreadCount (ALWAYS from ConversationParticipant)
        const updatedParticipants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
        });

        // 8️⃣ Get message with offer/order included (single query via relations)
        const messageWithData = await prisma.message.findUnique({
          where: { id: message.id },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
            offer: {
              select: {
                id: true,
                serviceId: true,
                clientId: true,
                freelancerId: true,
                conversationId: true,
                status: true,
                price: true,
                currency: true,
                deliveryTime: true,
                revisionsIncluded: true,
                scopeOfWork: true,
                cancellationPolicy: true,
                serviceTitle: true,
                serviceDescription: true,
                rejectionReason: true,
                rejectedAt: true,
                acceptedAt: true,
                orderId: true,
                createdAt: true,
                updatedAt: true,
                service: {
                  select: {
                    id: true,
                    title: true,
                    images: true,
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
                order: true,
              },
            },
            order: true,
          },
        });

        const messageToEmit = messageWithData || { ...message, offer: null, order: null };

        // 9️⃣ Emit new_message to conversation room (for chat window) - with status tracking, order data, and offer data
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message: messageToEmit, // Include deliveredAt, seenAt, order data, and offer data
          conversationId,
        });

        // 🔟 Emit conversation:updated to EACH USER'S PERSONAL ROOM (for inbox/list)
        // CRITICAL: Each user gets their own unreadCount from ConversationParticipant (never calculated)
        for (const p of updatedParticipants) {
          const participantData = updatedParticipants.find(up => up.userId === p.userId);
          
          // Format conversation with participant-specific data
          const formattedConversation = {
            id: updatedConversation.id,
            lastMessageText: updatedConversation.lastMessageText,
            lastMessageAt: updatedConversation.lastMessageAt, // Use this for ordering
            lastSenderId: updatedConversation.lastSenderId,
            createdAt: updatedConversation.createdAt,
            updatedAt: updatedConversation.updatedAt,
            participants: updatedConversation.participants,
            otherParticipant: updatedConversation.participants.find(part => part.userId !== p.userId)?.user,
            unreadCount: participantData?.unreadCount || 0, // ALWAYS from ConversationParticipant.unreadCount
            // Format lastMessage with status tracking
            lastMessage: {
              id: messageToEmit.id,
              content: messageToEmit.content,
              senderId: messageToEmit.senderId,
              createdAt: messageToEmit.createdAt,
              deliveredAt: messageToEmit.deliveredAt,
              seenAt: messageToEmit.seenAt,
              sender: messageToEmit.sender,
              type: messageToEmit.type,
              order: messageToEmit.order,
              offer: messageToEmit.offer,
            },
          };

          // Emit to user's personal room - ensures proper reordering
          io.to(`user:${p.userId}`).emit('conversation:updated', {
            conversation: formattedConversation,
          });

          // Create bell notification for recipient when they have unread (conversation not open)
          if (p.userId !== userId && (participantData?.unreadCount || 0) > 0) {
            const senderName = messageToEmit.sender?.name || 'Someone';
            const snippet = (messageToEmit.content || '').trim().slice(0, 60);
            try {
              const { createNotification } = await import('./services/notificationService.js');
              await createNotification({
                userId: p.userId,
                title: 'New message',
                body: `${senderName}: ${snippet || 'Sent a message'}`,
                type: 'message',
                data: { conversationId, senderId: userId },
              });
            } catch (err) {
              console.error('Chat notification failed:', err);
            }
          }
        }

        // 1️⃣1️⃣ If recipient comes online later, update deliveredAt
        if (!isRecipientOnline && recipient) {
          // Set up listener for when recipient comes online (handled in connection handler)
          // For now, we'll update deliveredAt when they join the conversation room
        }

        // 1️⃣2️⃣ Update lastActive for sender
        presence.updateUserData(userId, { lastActive: Date.now() });

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

        // Get all orders for this conversation
        try {
          const orders = await prisma.order.findMany({
          where: {
            conversationId,
            OR: [
              { clientId: userId },
              { freelancerId: userId },
            ],
          },
            select: {
              id: true,
              orderNumber: true,
              serviceId: true,
              clientId: true,
              freelancerId: true,
              conversationId: true,
              status: true,
              price: true,
              currency: true,
              deliveryTime: true,
              revisionsIncluded: true,
              revisionsUsed: true,
              deliveryDate: true,
              completedAt: true,
              cancelledAt: true,
              cancellationReason: true,
              cancelledBy: true,
              createdAt: true,
              updatedAt: true,
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
            deliverables: {
              orderBy: { deliveredAt: 'desc' },
              take: 1,
            },
          },
            orderBy: {
              createdAt: 'desc',
            },
          });

          socket.emit('order:fetched', { orders, count: orders.length });
        } catch (dbError) {
          // Fallback if column doesn't exist
          if (dbError.code === 'P2022' || dbError.message.includes('does not exist')) {
            console.warn('Database column missing, using fallback query');
            const orders = await prisma.order.findMany({
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
                deliverables: {
                  orderBy: { deliveredAt: 'desc' },
                  take: 1,
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            });
            socket.emit('order:fetched', { orders, count: orders.length });
          } else {
            throw dbError;
          }
        }
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

      // Remove socket (user stays online if other devices connected)
      presence.removeSocket(userId, socket.id);
      
      // Broadcast presence update to authenticated clients
      broadcastPresenceUpdate();
      
      // Broadcast public presence update (freelancers only)
      broadcastPublicPresenceUpdate();

      console.log(`📊 Online users: ${presence.getOnlineUsers().length}`);
    });
  });

  // Store on global for API routes (Next.js may load a separate module instance)
  if (typeof globalThis !== 'undefined') globalThis.__SOCKET_IO__ = io;
  if (typeof global !== 'undefined') global.__SOCKET_IO__ = io;

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

/** Returns io instance if available (from this module or global), or null. Use from API routes where initSocket may run in another module instance. */
const getIOIfAvailable = () => io || (typeof globalThis !== 'undefined' && globalThis.__SOCKET_IO__) || (typeof global !== 'undefined' && global.__SOCKET_IO__) || null;

// Helpers delegate to presence module (re-export for backward compat)
const isUserOnline = (userId) => presence.isUserOnline(userId);
const getOnlineUser = (userId) => presence.getOnlineUser(userId);
const getOnlineUsers = () => presence.getOnlineUsers();


/**
 * Emit order event to relevant users
 * This should be called from API routes after order operations
 */
const emitOrderEvent = (eventType, order, additionalData = {}) => {
  const ioInstance = io || globalThis?.__SOCKET_IO__ || global?.__SOCKET_IO__;
  if (!ioInstance) {
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

  console.log(`📦 Emitting order event: ${eventType}`, {
    orderId: order.id,
    orderStatus: order.status,
    clientId,
    freelancerId,
    conversationId,
  });

  // Emit to client's personal room
  ioInstance.to(`user:${clientId}`).emit('order:updated', eventData);
  console.log(`  ✅ Emitted to user:${clientId}`);

  // Emit to freelancer's personal room
  ioInstance.to(`user:${freelancerId}`).emit('order:updated', eventData);
  console.log(`  ✅ Emitted to user:${freelancerId}`);

  // Emit to order room (anyone viewing order detail: client, freelancer, admin)
  ioInstance.to(`order:${order.id}`).emit('order:updated', eventData);
  console.log(`  ✅ Emitted to order:${order.id}`);

  // Also emit to conversation room if exists (for users currently viewing the chat)
  if (conversationId) {
    ioInstance.to(`conversation:${conversationId}`).emit('order:updated', eventData);
    console.log(`  ✅ Emitted to conversation:${conversationId}`);
  }

  console.log(`📦 Order event emitted successfully: ${eventType} for order ${order.id}`);
};

/**
 * Emit offer event to relevant users
 * This should be called from API routes after offer operations
 */
const emitOfferEvent = (eventType, offer, additionalData = {}) => {
  const ioInstance = io || globalThis?.__SOCKET_IO__ || global?.__SOCKET_IO__;
  if (!ioInstance) {
    console.warn('Socket.IO not initialized, cannot emit offer event');
    return;
  }

  const { clientId, freelancerId, conversationId } = offer;

  // Emit to both client and freelancer's personal rooms
  const eventData = {
    offer,
    eventType,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  console.log(`💼 Emitting offer event: ${eventType}`, {
    offerId: offer.id,
    offerStatus: offer.status,
    clientId,
    freelancerId,
    conversationId,
  });

  // Emit to client's personal room
  ioInstance.to(`user:${clientId}`).emit('offer:updated', eventData);
  console.log(`  ✅ Emitted to user:${clientId}`);

  // Emit to freelancer's personal room
  ioInstance.to(`user:${freelancerId}`).emit('offer:updated', eventData);
  console.log(`  ✅ Emitted to user:${freelancerId}`);

  // Also emit to conversation room if exists (for users currently viewing the chat)
  if (conversationId) {
    ioInstance.to(`conversation:${conversationId}`).emit('offer:updated', eventData);
    console.log(`  ✅ Emitted to conversation:${conversationId}`);
  }

  // Broadcast to ALL authenticated clients (ensures freelancer gets update in separate browser)
  ioInstance.emit('offer:updated', eventData);
  console.log(`  ✅ Broadcast to all`);

  console.log(`💼 Offer event emitted successfully: ${eventType} for offer ${offer.id}`);
};

/**
 * Emit dispute comment event - real-time update when someone adds a comment to a dispute
 * Emits to dispute room (users viewing the thread) and to client/freelancer user rooms (for notifications)
 */
const emitDisputeCommentEvent = (disputeId, comment, { clientId, freelancerId } = {}) => {
  const ioInstance = io || globalThis?.__SOCKET_IO__ || global?.__SOCKET_IO__;
  if (!ioInstance) {
    console.warn('Socket.IO not initialized, cannot emit dispute comment event');
    return;
  }

  const eventData = {
    disputeId,
    comment,
    timestamp: new Date().toISOString(),
  };

  ioInstance.to(`dispute:${disputeId}`).emit('dispute:new_comment', eventData);
  console.log(`📢 Emitted dispute:new_comment to dispute:${disputeId}`);

  if (clientId) {
    ioInstance.to(`user:${clientId}`).emit('dispute:new_comment', eventData);
  }
  if (freelancerId) {
    ioInstance.to(`user:${freelancerId}`).emit('dispute:new_comment', eventData);
  }
};

module.exports = { 
  initSocket, 
  getIO, 
  getIOIfAvailable,
  isUserOnline, 
  getOnlineUser, 
  getOnlineUsers,
  emitOrderEvent,
  emitOfferEvent,
  emitDisputeCommentEvent,
};
