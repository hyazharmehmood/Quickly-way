# Chat Module Documentation

## Overview

The Chat Module is a real-time messaging system built with Socket.IO that enables communication between clients, freelancers, and admins. It provides instant messaging, presence tracking, typing indicators, and read receipts.

## Architecture

### Technology Stack
- **Backend**: Socket.IO Server (Node.js)
- **Frontend**: Socket.IO Client (React)
- **Database**: PostgreSQL (via Prisma)
- **State Management**: Zustand
- **Framework**: Next.js 16

### Key Features
- ✅ Real-time messaging via Socket.IO (no REST API calls)
- ✅ Global presence tracking (online/active/offline status)
- ✅ Chat-level presence (shows when user is actively chatting)
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Heartbeat system (25s interval)
- ✅ Auto-reconnection
- ✅ Smart message delivery (instant for online users, stored for offline)

---

## File Structure

```
quicklyway/
├── lib/
│   └── socket.js                    # Socket.IO server implementation
├── hooks/
│   └── useGlobalSocket.js           # Global Socket.IO client hook
├── components/chat/
│   ├── ChatContainer.jsx           # Main chat container component
│   ├── ChatList.jsx                 # Conversation list sidebar
│   ├── ChatWindow.jsx               # Chat window with messages
│   └── UserStatus.jsx               # User online status indicator
├── store/
│   └── usePresenceStore.js          # Zustand store for presence tracking
└── CHAT_MODULE_DOCUMENTATION.md     # This file
```

---

## Backend Implementation

### Socket.IO Server (`lib/socket.js`)

#### Initialization
```javascript
const initSocket = (server) => {
  io = new Server(server, {
    path: '/api/socket',
    cors: { origin: true },
    transports: ['websocket', 'polling'],
  });
}
```

#### Authentication
- Uses JWT token from `socket.handshake.auth.token`
- Verifies token and loads user from database
- Attaches `userId` and `user` to socket object

#### Global Presence System
- **Map Structure**: `userId => { socketId, role, lastActive, chattingWith }`
- **Heartbeat**: Updates `lastActive` every 25 seconds
- **Cleanup**: Removes inactive users after 30 seconds
- **Broadcast**: Emits `presence:update` to all clients on changes

#### Socket Events (Server-Side)

##### Client → Server Events

| Event | Description | Parameters |
|-------|-------------|------------|
| `heartbeat` | Keep-alive signal | None |
| `chat:focus` | User opened chat with partner | `{ partnerId }` |
| `chat:blur` | User left chat | None |
| `join_conversation` | Join conversation room | `conversationId` |
| `leave_conversation` | Leave conversation room | `conversationId` |
| `fetch_messages` | Get messages for conversation | `{ conversationId, page, limit }` |
| `get_conversations` | Get user's conversation list | None |
| `get_conversation` | Get single conversation | `{ conversationId }` |
| `create_conversation` | Create or get conversation | `{ otherUserId }` |
| `send_message` | Send a message | `{ conversationId, content }` |
| `mark_read` | Mark message as read | `{ messageId, conversationId }` |
| `typing` | Typing indicator | `{ conversationId, isTyping }` |

##### Server → Client Events

| Event | Description | Data |
|-------|-------------|------|
| `presence:connected` | Initial presence data | `{ userId, onlineUsers[] }` |
| `presence:update` | Updated presence data | `{ onlineUsers[], timestamp }` |
| `joined_conversation` | Confirmed join | `conversationId` |
| `left_conversation` | Confirmed leave | `conversationId` |
| `messages:fetched` | Messages received | `{ conversationId, messages[], page, hasMore }` |
| `conversations:fetched` | Conversations list | `{ conversations[] }` |
| `conversation:fetched` | Single conversation | `{ conversation }` |
| `conversation:created` | Conversation created | `{ conversation }` |
| `new_message` | New message received | `{ message, conversationId }` |
| `message:sent` | Message sent confirmation | `{ message, conversationId, delivered }` |
| `message:read` | Message read confirmation | `{ messageId, conversationId }` |
| `user_typing` | Typing indicator | `{ userId, userName, conversationId, isTyping }` |
| `error` | Error occurred | `{ message }` |

---

## Frontend Implementation

### Global Socket Hook (`hooks/useGlobalSocket.js`)

#### Purpose
- Connects Socket.IO immediately when user logs in
- Manages global connection state
- Handles presence updates
- Provides socket instance to all components

#### Usage
```javascript
import { useGlobalSocket } from '@/hooks/useGlobalSocket';

function MyComponent() {
  const { socket, isConnected } = useGlobalSocket();
  
  // Use socket for events
  socket?.emit('event_name', data);
}
```

#### Features
- Auto-connects on login (500ms delay to avoid login interference)
- Heartbeat every 25 seconds
- Auto-reconnection with exponential backoff
- Cleans up on logout

### Presence Store (`store/usePresenceStore.js`)

#### Purpose
- Stores global online users map
- Provides helper functions for status checks

#### Usage
```javascript
import usePresenceStore from '@/store/usePresenceStore';

function MyComponent() {
  const { getUserStatus, isUserOnline } = usePresenceStore();
  
  const status = getUserStatus(otherUserId, currentUserId);
  // Returns: 'online' | 'active' | 'offline'
}
```

#### Status Logic
- **🟢 Online**: User online AND `chattingWith === me`
- **🟡 Active**: User online but not chatting with me
- **⚫ Offline**: User not in `onlineUsers` map

### Chat Components

#### ChatContainer (`components/chat/ChatContainer.jsx`)
- Main container component
- Manages selected conversation state
- Handles URL-based conversation loading
- Renders ChatList and ChatWindow

#### ChatList (`components/chat/ChatList.jsx`)
- Displays list of conversations
- Search functionality
- Real-time updates when new messages arrive
- Shows user status for each conversation

#### ChatWindow (`components/chat/ChatWindow.jsx`)
- Displays messages for selected conversation
- Message input and sending
- Typing indicators
- Auto-scroll to bottom
- Read receipts

#### UserStatus (`components/chat/UserStatus.jsx`)
- Visual indicator for user online status
- Shows 🟢 Online / 🟡 Active / ⚫ Offline

---

## Data Flow

### Message Sending Flow
```
1. User types message → ChatWindow
2. socket.emit('send_message', { conversationId, content })
3. Server creates message in DB
4. Server checks if receiver is online
5. If online: Instant delivery via socket
6. If offline: Store in DB, mark as unread
7. Server emits 'message:sent' to sender
8. Server emits 'new_message' to receiver (if online)
9. Frontend updates UI
```

### Presence Flow
```
1. User connects → Server adds to onlineUsers map
2. Server emits 'presence:update' to all clients
3. Frontend updates usePresenceStore
4. UI components read from store and display status
5. When user opens chat → emit 'chat:focus'
6. Server updates chattingWith field
7. Server emits 'presence:update' to partner
8. Partner sees status change to "Online"
```

### Conversation Creation Flow
```
1. User clicks "Contact Me" → ServiceDetailPage
2. socket.emit('create_conversation', { otherUserId })
3. Server checks if conversation exists
4. If exists: Return existing conversation
5. If not: Create new conversation with participants
6. Server emits 'conversation:created' to client
7. Client navigates to /messages?conversationId=xxx
8. ChatContainer loads conversation from URL
9. ChatWindow opens with conversation
```

---

## Database Schema

### Models

#### Conversation
```prisma
model Conversation {
  id            String   @id @default(uuid())
  participants  ConversationParticipant[]
  lastMessage   Message?
  lastMessageId String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  messages      Message[]
}
```

#### ConversationParticipant
```prisma
model ConversationParticipant {
  id             String   @id @default(uuid())
  conversationId  String
  conversation    Conversation
  userId          String
  user            User
  joinedAt        DateTime @default(now())
  
  @@unique([conversationId, userId])
}
```

#### Message
```prisma
model Message {
  id             String   @id @default(uuid())
  content        String
  senderId       String
  sender         User
  conversationId String
  conversation   Conversation
  isRead         Boolean  @default(false)
  seenBy         MessageSeen[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### MessageSeen
```prisma
model MessageSeen {
  id         String   @id @default(uuid())
  messageId  String
  message    Message
  userId     String
  user       User
  seenAt     DateTime @default(now())
  
  @@unique([messageId, userId])
}
```

---

## Configuration

### Environment Variables

```env
# Socket.IO URL (optional, defaults to window.location.origin)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Server Configuration

The Socket.IO server is initialized in `server.js`:
```javascript
const httpServer = createServer();
initSocket(httpServer);
```

---

## Usage Examples

### Creating a Conversation
```javascript
const { socket, isConnected } = useGlobalSocket();

socket.emit('create_conversation', { otherUserId: 'user-id' });

socket.once('conversation:created', (data) => {
  console.log('Conversation:', data.conversation);
});
```

### Sending a Message
```javascript
socket.emit('send_message', {
  conversationId: 'conv-id',
  content: 'Hello!'
});

socket.on('message:sent', (data) => {
  console.log('Message sent:', data.message);
});
```

### Fetching Messages
```javascript
socket.emit('fetch_messages', {
  conversationId: 'conv-id',
  page: 1,
  limit: 50
});

socket.once('messages:fetched', (data) => {
  setMessages(data.messages);
});
```

### Listening for New Messages
```javascript
useEffect(() => {
  if (!socket) return;
  
  const handleNewMessage = (data) => {
    if (data.conversationId === currentConversationId) {
      setMessages(prev => [...prev, data.message]);
    }
  };
  
  socket.on('new_message', handleNewMessage);
  
  return () => {
    socket.off('new_message', handleNewMessage);
  };
}, [socket, currentConversationId]);
```

### Checking User Status
```javascript
import usePresenceStore from '@/store/usePresenceStore';

function UserCard({ userId }) {
  const { getUserStatus, isUserOnline } = usePresenceStore();
  const { user: currentUser } = useAuthStore();
  
  const status = getUserStatus(userId, currentUser.id);
  
  return (
    <div>
      {status === 'online' && '🟢 Online'}
      {status === 'active' && '🟡 Active'}
      {status === 'offline' && '⚫ Offline'}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Check Connection
```javascript
if (!socket || !isConnected) {
  // Handle disconnected state
  return;
}
```

### 2. Clean Up Event Listeners
```javascript
useEffect(() => {
  const handler = (data) => { /* ... */ };
  socket.on('event', handler);
  
  return () => {
    socket.off('event', handler);
  };
}, [socket]);
```

### 3. Use `once` for One-Time Events
```javascript
socket.once('conversation:created', (data) => {
  // Handle once
});
```

### 4. Handle Errors
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Show user-friendly error message
});
```

### 5. Use Presence Store for Status
```javascript
// ✅ Good
const status = getUserStatus(userId, currentUserId);

// ❌ Bad
const isOnline = socket?.connected; // This only checks your connection
```

---

## Troubleshooting

### Connection Issues
- Check if `NEXT_PUBLIC_SOCKET_URL` is set correctly
- Verify server is running on correct port
- Check browser console for connection errors
- Ensure JWT token is valid

### Messages Not Appearing
- Verify user is participant in conversation
- Check if socket is connected
- Verify event listeners are set up
- Check server logs for errors

### Presence Not Updating
- Verify heartbeat is working (check console logs)
- Check if `usePresenceStore` is being updated
- Verify `presence:update` events are being received

### Performance Issues
- Limit message pagination (default: 50 messages)
- Use `once` instead of `on` for one-time events
- Clean up event listeners properly
- Consider debouncing typing indicators

---

## API Reference

### Socket.IO Events Summary

#### Client → Server
- `heartbeat` - Keep connection alive
- `chat:focus` - User opened chat
- `chat:blur` - User left chat
- `join_conversation` - Join room
- `leave_conversation` - Leave room
- `fetch_messages` - Get messages
- `get_conversations` - Get conversation list
- `get_conversation` - Get single conversation
- `create_conversation` - Create conversation
- `send_message` - Send message
- `mark_read` - Mark as read
- `typing` - Typing indicator

#### Server → Client
- `presence:connected` - Initial presence
- `presence:update` - Presence update
- `joined_conversation` - Join confirmation
- `left_conversation` - Leave confirmation
- `messages:fetched` - Messages response
- `conversations:fetched` - Conversations response
- `conversation:fetched` - Single conversation
- `conversation:created` - Conversation created
- `new_message` - New message
- `message:sent` - Send confirmation
- `message:read` - Read confirmation
- `user_typing` - Typing indicator
- `error` - Error occurred

---

## Future Enhancements

- [ ] File attachments
- [ ] Voice messages
- [ ] Video calls
- [ ] Group conversations
- [ ] Message reactions
- [ ] Message search
- [ ] Message forwarding
- [ ] Push notifications
- [ ] Message encryption
- [ ] Message scheduling

---

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Check browser console
4. Verify database schema
5. Test Socket.IO connection manually

---

**Last Updated**: January 2025
**Version**: 1.0.0

