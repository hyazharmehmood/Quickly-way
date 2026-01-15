# Real-Time Presence System Documentation

## Overview

This system provides Fiverr/Upwork-level real-time presence tracking for client-freelancer-admin communication.

## Architecture

### Backend (`lib/socket.js`)

#### Global Online Users Map
```javascript
onlineUsers: Map<userId, {
  socketId: string,
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN',
  lastActive: number (timestamp),
  chattingWith: userId | null
}>
```

#### Key Features

1. **Automatic Connection on Login**
   - Socket connects immediately when user logs in
   - Managed globally via `useGlobalSocket` hook
   - Initialized in `AuthInitializer` component

2. **Heartbeat System**
   - Client sends heartbeat every 25 seconds
   - Server updates `lastActive` timestamp
   - Inactive users removed after 30 seconds of no heartbeat

3. **Presence Updates**
   - `presence:update` event broadcasted to all clients on:
     - User connects
     - User disconnects
     - User starts/stops chatting
   - All dashboards update instantly

4. **Chat Focus/Blur**
   - `chat:focus { partnerId }` - User opens chat
   - `chat:blur` - User leaves chat
   - Updates `chattingWith` field in onlineUsers map

5. **Smart Message Delivery**
   - **Online receiver**: Instant delivery via socket
   - **Offline receiver**: Stored in DB, marked as unread
   - Auto-mark as read if receiver is actively chatting

### Frontend

#### Global Socket Connection (`hooks/useGlobalSocket.js`)

- Connects immediately on login
- Maintains connection across all pages
- Sends heartbeat every 25 seconds
- Listens for presence updates

#### Presence Store (`store/usePresenceStore.js`)

- Zustand store for online users
- Provides status calculation logic:
  - `getUserStatus(userId, currentUserId)` returns:
    - `'online'` - User online AND chatting with me 🟢
    - `'active'` - User online only 🟡
    - `'offline'` - User not online ⚫

#### User Status Component (`components/chat/UserStatus.jsx`)

- Visual indicator for user status
- Shows colored dot (green/yellow/gray)
- Optional label

## Status Logic

| Condition | Status | Icon |
|-----------|--------|------|
| User online AND `chattingWith === me` | 🟢 Online | Green dot |
| User online only | 🟡 Active | Yellow dot |
| User not in `onlineUsers` | ⚫ Offline | Gray dot |

## Events

### Client → Server

- `heartbeat` - Sent every 25 seconds
- `chat:focus { partnerId }` - User opens chat
- `chat:blur` - User leaves chat
- `join_conversation { conversationId }` - Join conversation room
- `leave_conversation { conversationId }` - Leave conversation room
- `send_message { conversationId, content }` - Send message

### Server → Client

- `presence:connected` - Initial online users list on connect
- `presence:update` - Updated online users list
- `new_message { message, conversationId }` - New message received
- `message:sent { message, conversationId, delivered }` - Message sent confirmation

## Usage Examples

### Check User Status

```jsx
import { UserStatus } from '@/components/chat/UserStatus';

<UserStatus userId="user-123" showLabel={true} size="md" />
```

### Get Status Programmatically

```jsx
import usePresenceStore from '@/store/usePresenceStore';
import useAuthStore from '@/store/useAuthStore';

const { getUserStatus } = usePresenceStore();
const { user } = useAuthStore();

const status = getUserStatus(otherUserId, user.id);
// Returns: 'online' | 'active' | 'offline'
```

### Chat Focus/Blur (Automatic)

The `ChatWindow` component automatically emits:
- `chat:focus` when conversation opens
- `chat:blur` when conversation closes

### Manual Chat Focus

```jsx
const { socket } = useGlobalSocket();

// When user opens chat
socket.emit('chat:focus', { partnerId: otherUserId });

// When user leaves chat
socket.emit('chat:blur');
```

## Message Delivery Flow

1. **Sender sends message** → `send_message` event
2. **Server checks receiver status**:
   - If `onlineUsers.has(receiverId)`:
     - Instant delivery via socket
     - If `chattingWith === senderId`: Auto-mark as read
   - Else:
     - Store in DB
     - Mark as unread
3. **Receiver fetches unread** on next connection

## Scaling Considerations

### Current Implementation
- In-memory `Map` for online users
- Works for single server deployment
- Handles thousands of concurrent users

### For Multi-Server (Redis)
```javascript
// Future: Use Redis for onlineUsers
const redis = require('redis');
const client = redis.createClient();

// Store: userId => JSON.stringify(userData)
// Publish presence updates via Redis pub/sub
```

## Performance

- **Heartbeat**: 25s interval (low overhead)
- **Cleanup**: 30s interval (removes inactive users)
- **Presence Updates**: Only on state changes (not continuous polling)
- **Memory**: ~100 bytes per online user

## Testing

### Test Connection
1. Login → Check console for "✅ Global Socket.IO Connected!"
2. Check presence store: `usePresenceStore.getState().getAllOnlineUsers()`

### Test Status
1. Open chat with user → Should see 🟢 Online
2. Close chat → Should see 🟡 Active
3. User disconnects → Should see ⚫ Offline

### Test Heartbeat
1. Monitor server logs for heartbeat events
2. Wait 30s without activity → User should be removed

## Troubleshooting

### Socket not connecting
- Check `NEXT_PUBLIC_SOCKET_URL` in `.env`
- Verify user is logged in
- Check browser console for errors

### Status not updating
- Verify `presence:update` events are received
- Check presence store: `usePresenceStore.getState().onlineUsers`
- Ensure heartbeat is running (check console)

### Ghost online users
- Heartbeat cleanup runs every 30s
- Inactive timeout: 30s
- Check server logs for cleanup messages

