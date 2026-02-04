# Online/Offline Status - Socket.IO Full Flow Documentation

This document explains the complete flow of how online/offline status is implemented using Socket.IO in the application.

## Overview

The online/offline status system uses Socket.IO to track user presence in real-time. Users are considered **online** when their socket is connected and **offline** when disconnected.

**Key Features:**
- ✅ **Authenticated Users**: Full presence data (all users, private data like socketId, chattingWith)
- ✅ **Guest Users**: Public presence data (freelancer IDs only, no private data)
- ✅ **Single Source of Truth**: Same `onlineUsers` Map on server for both authenticated and public presence
- ✅ **Real-Time Updates**: Event-driven updates, no polling

---

## Architecture Components

### 1. **Backend (Server-Side)**
- **File**: `lib/socket.js`
- **Purpose**: Manages socket connections, tracks online users, broadcasts presence updates
- **Namespaces**:
  - Default namespace (`/`): Authenticated users only (JWT required)
  - Public namespace (`/presence`): Guest users (no authentication)

### 2. **Frontend (Client-Side)**
- **Authenticated Hook**: `hooks/useGlobalSocket.js` - Manages authenticated socket connection
- **Public Hook**: `hooks/usePublicPresence.js` - Manages public presence connection (guests)
- **Authenticated Store**: `store/usePresenceStore.js` - Stores full online users state (authenticated)
- **Public Store**: `store/usePublicPresenceStore.js` - Stores online freelancer IDs only (guests)
- **Component**: `components/chat/UserStatus.jsx` - Displays user status (uses both stores)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER LOGS IN                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CLIENT: useGlobalSocket Hook Initializes                    │
│     - Waits 500ms after login                                    │
│     - Creates Socket.IO connection with auth token              │
│     - Sets up event listeners                                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SERVER: Socket Authentication                               │
│     - Verifies JWT token from handshake                          │
│     - Fetches user from database                                 │
│     - Attaches user data to socket                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. SERVER: User Connection Established                         │
│     - Adds user to onlineUsers Map:                             │
│       onlineUsers.set(userId, {                                 │
│         socketId: socket.id,                                     │
│         role: user.role,                                         │
│         lastActive: Date.now(),                                 │
│         chattingWith: null                                      │
│       })                                                         │
│     - Joins user to personal room: `user:${userId}`            │
│     - Broadcasts presence update to ALL clients                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SERVER: Sends Initial Presence Data                         │
│     - Emits 'presence:connected' to connecting user             │
│     - Includes all online users list                            │
│     - Emits 'presence:update' to ALL clients                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. CLIENT: Receives Presence Updates                           │
│     - useGlobalSocket listens for:                              │
│       • 'presence:connected' - Initial online users             │
│       • 'presence:update' - Real-time updates                   │
│     - Updates usePresenceStore with online users                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. CLIENT: Components Display Status                           │
│     - UserStatus component calls getUserStatus(userId)          │
│     - Checks if userId exists in onlineUsers Map                │
│     - Shows 🟢 Online if exists, ⚫ Offline if not              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER DISCONNECTS                              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. SERVER: Handles Disconnect                                   │
│     - Removes user from onlineUsers Map                         │
│     - Broadcasts 'presence:update' to ALL clients               │
│     - All clients now see user as offline                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Step-by-Step Flow

### **Step 1: User Login & Socket Initialization**

**Location**: `hooks/useGlobalSocket.js`

```javascript
// After user logs in, hook detects login state
useEffect(() => {
  if (!isLoggedIn || !token || !user) {
    // Disconnect if logged out
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }
    return;
  }

  // Wait 500ms to ensure login API completes
  globalConnectTimeout = setTimeout(() => {
    // Create Socket.IO connection
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    
    globalSocket = socketInstance;
  }, 500);
}, [isLoggedIn, token, user]);
```

**What happens:**
- Hook waits 500ms after login to avoid interfering with login API
- Creates Socket.IO client with JWT token in auth
- Sets up automatic reconnection

---

### **Step 2: Server Authentication**

**Location**: `lib/socket.js`

```javascript
// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.id }
  });
  
  socket.userId = user.id;
  socket.user = user;
  next();
});
```

**What happens:**
- Server verifies JWT token
- Fetches user from database
- Attaches user data to socket object

---

### **Step 3: Connection Established**

**Location**: `lib/socket.js`

```javascript
io.on('connection', (socket) => {
  const userId = socket.userId;
  
  // Add user to online map
  onlineUsers.set(userId, {
    socketId: socket.id,
    role: socket.user.role,
    lastActive: Date.now(),
    chattingWith: null,
  });
  
  // Join personal room
  socket.join(`user:${userId}`);
  
  // Broadcast to all clients
  broadcastPresenceUpdate();
  
  // Send initial data to connecting user
  socket.emit('presence:connected', {
    userId,
    onlineUsers: Array.from(onlineUsers.entries()).map(...)
  });
});
```

**What happens:**
- User added to `onlineUsers` Map (server-side)
- User joins personal room `user:${userId}`
- Server broadcasts presence update to ALL clients
- Server sends initial online users list to connecting user

---

### **Step 4: Client Receives Presence Data**

**Location**: `hooks/useGlobalSocket.js`

```javascript
// Presence listeners (added only once)
if (!__presenceListenersAdded) {
  socketInstance.on('presence:connected', (data) => {
    console.log('👥 Presence: Initial online users received', data.onlineUsers.length);
    updateOnlineUsers(data.onlineUsers);
  });

  socketInstance.on('presence:update', (data) => {
    console.log('👥 Presence: Online users updated', data.onlineUsers.length);
    updateOnlineUsers(data.onlineUsers);
  });
  
  __presenceListenersAdded = true;
}
```

**What happens:**
- Client receives `presence:connected` with initial online users
- Client receives `presence:update` whenever someone connects/disconnects
- Both events call `updateOnlineUsers()` to update the store

---

### **Step 5: Store Updates**

**Location**: `store/usePresenceStore.js`

```javascript
const usePresenceStore = create((set, get) => ({
  onlineUsers: new Map(), // userId => { socketId, role, lastActive, chattingWith }
  
  updateOnlineUsers: (users) => {
    const map = new Map();
    users.forEach((user) => {
      map.set(user.userId, {
        socketId: user.socketId,
        role: user.role,
        lastActive: user.lastActive,
        chattingWith: user.chattingWith,
      });
    });
    set({ onlineUsers: map });
  },
  
  getUserStatus: (userId, currentUserId) => {
    const { onlineUsers } = get();
    const user = onlineUsers.get(userId);
    // If user exists in map = online, else = offline
    return user ? 'online' : 'offline';
  },
}));
```

**What happens:**
- Store maintains a Map of online users
- `updateOnlineUsers()` replaces entire map with new data
- `getUserStatus()` checks if userId exists in map

---

### **Step 6: Component Displays Status**

**Location**: `components/chat/UserStatus.jsx`

```javascript
export function UserStatus({ userId, showLabel = false, size = 'sm' }) {
  const { getUserStatus } = usePresenceStore();
  const { user: currentUser } = useAuthStore();
  
  const status = getUserStatus(userId, currentUser?.id);
  
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      label: 'Online',
      icon: '🟢',
    },
    offline: {
      color: 'bg-gray-400',
      label: 'Offline',
      icon: '⚫',
    },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${config.color} ${sizeClasses[size]} rounded-full`} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}
```

**What happens:**
- Component calls `getUserStatus(userId)`
- If user exists in store = shows green dot (online)
- If user not in store = shows gray dot (offline)

---

### **Step 7: User Disconnects**

**Location**: `lib/socket.js`

```javascript
socket.on('disconnect', (reason) => {
  console.log(`❌ Socket.IO: User ${userId} disconnected`, { reason });
  
  // Remove from online users
  onlineUsers.delete(userId);
  
  // Broadcast presence update to all clients
  broadcastPresenceUpdate();
  
  console.log(`📊 Online users: ${onlineUsers.size}`);
});
```

**What happens:**
- Server removes user from `onlineUsers` Map
- Server broadcasts `presence:update` to ALL clients
- All clients update their stores (user removed from map)
- All `UserStatus` components re-render showing user as offline

---

## Real-Time Updates Flow

### **When User A Connects:**

1. **Server**: Adds User A to `onlineUsers` Map
2. **Server**: Broadcasts `presence:update` to ALL clients
3. **All Clients**: Receive update, call `updateOnlineUsers()`
4. **All Clients**: Store updated, User A now in `onlineUsers` Map
5. **All Components**: `UserStatus` components re-render
6. **UI**: User A shows as 🟢 Online everywhere

### **When User B Disconnects:**

1. **Server**: Removes User B from `onlineUsers` Map
2. **Server**: Broadcasts `presence:update` to ALL clients
3. **All Clients**: Receive update, call `updateOnlineUsers()`
4. **All Clients**: Store updated, User B removed from `onlineUsers` Map
5. **All Components**: `UserStatus` components re-render
6. **UI**: User B shows as ⚫ Offline everywhere

---

## Heartbeat Mechanism

**Purpose**: Keep connection alive and update `lastActive` timestamp

**Client Side** (`hooks/useGlobalSocket.js`):
```javascript
// Start heartbeat every 25 seconds
globalHeartbeatInterval = setInterval(() => {
  if (socketInstance.connected) {
    socketInstance.emit('heartbeat');
  }
}, 25000);
```

**Server Side** (`lib/socket.js`):
```javascript
socket.on('heartbeat', () => {
  const userData = onlineUsers.get(userId);
  if (userData) {
    userData.lastActive = Date.now();
    onlineUsers.set(userId, userData);
  }
});
```

**Note**: Heartbeat doesn't affect online/offline status. Status is purely based on socket connection/disconnection.

---

## Key Points

1. **Online = Socket Connected**: User is online only when socket is connected
2. **Offline = Socket Disconnected**: User is offline when socket disconnects
3. **Real-Time Updates**: All clients receive presence updates via `presence:update` event
4. **Single Source of Truth**: Server maintains `onlineUsers` Map, clients sync via events
5. **No Polling**: Status updates are event-driven, not polled
6. **Automatic Reconnection**: Socket.IO automatically reconnects on network issues

---

## Usage Examples

### **Display User Status in Chat List**

```jsx
import { UserStatus } from '@/components/chat/UserStatus';

<UserStatus userId={otherUser.id} size="sm" />
```

### **Check if User is Online Programmatically**

```javascript
import usePresenceStore from '@/store/usePresenceStore';

const { isUserOnline } = usePresenceStore();
const isOnline = isUserOnline(userId);
```

### **Get All Online Users**

```javascript
import usePresenceStore from '@/store/usePresenceStore';

const { getAllOnlineUsers } = usePresenceStore();
const onlineUsers = getAllOnlineUsers();
```

---

## Troubleshooting

### **User shows offline but socket is connected**
- Check if `presence:update` events are being received
- Verify `updateOnlineUsers()` is being called
- Check browser console for presence event logs

### **Status not updating in real-time**
- Verify socket connection is active (`isConnected` from `useGlobalSocket`)
- Check server logs for `presence:update` broadcasts
- Ensure `broadcastPresenceUpdate()` is called on connect/disconnect

### **Multiple socket connections**
- Ensure `useGlobalSocket` uses singleton pattern (globalSocket)
- Check that only one socket instance exists
- Verify cleanup on logout

---

## Files Reference

**Backend:**
- **Socket Server**: `lib/socket.js` (authenticated + public namespaces)

**Frontend - Authenticated:**
- **Socket Hook**: `hooks/useGlobalSocket.js`
- **Presence Store**: `store/usePresenceStore.js`

**Frontend - Public (Guests):**
- **Public Presence Hook**: `hooks/usePublicPresence.js`
- **Public Presence Store**: `store/usePublicPresenceStore.js`

**Components:**
- **Status Component**: `components/chat/UserStatus.jsx` (uses both stores)
- **Initializer**: `components/auth/AuthInitializer.jsx` (initializes both hooks)
- **Chat List**: `components/chat/ChatList.jsx` (uses UserStatus)
- **Chat Window**: `components/chat/ChatWindow.jsx` (uses UserStatus)
- **Service Card**: `components/service/ServiceCard.jsx` (uses UserStatus)

---

## Public Presence Flow (Guest Users)

### **Overview**
Guest users (not logged in) can see freelancer online status via a public Socket.IO namespace. This allows Fiverr-style behavior where freelancer presence is public.

### **Architecture**

**Server Side** (`lib/socket.js`):
- Public namespace: `io.of('/presence')` - No authentication required
- Filters `onlineUsers` Map to only freelancers
- Sends only `userId` (no private data like socketId, chattingWith, etc.)

**Client Side**:
- Hook: `hooks/usePublicPresence.js` - Connects to `/presence` namespace
- Store: `store/usePublicPresenceStore.js` - Lightweight Set of freelancer IDs
- Component: `UserStatus` checks both stores (authenticated + public)

### **Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUEST USER VISITS SITE                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CLIENT: usePublicPresence Hook Initializes                 │
│     - Connects to /presence namespace (no auth)                 │
│     - Sets up event listeners                                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SERVER: Public Namespace Connection                        │
│     - No authentication required                                │
│     - Sends initial freelancer IDs list                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. CLIENT: Receives Initial Freelancer IDs                   │
│     - usePublicPresence listens for 'presence:connected'        │
│     - Updates usePublicPresenceStore (Set of IDs)               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. FREELANCER CONNECTS/DISCONNECTS                            │
│     - Server broadcasts to BOTH:                                │
│       • Authenticated namespace (full data)                     │
│       • Public namespace (freelancer IDs only)                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. CLIENT: Receives Real-Time Updates                        │
│     - usePublicPresence listens for 'presence:update'          │
│     - Updates store with new freelancer IDs list                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. UI: UserStatus Component Shows Status                      │
│     - Checks usePublicPresenceStore for guest users             │
│     - Shows 🟢 Online if freelancer ID in Set                  │
│     - Shows ⚫ Offline if not in Set                            │
└─────────────────────────────────────────────────────────────────┘
```

### **Data Privacy**

**What Guest Users See:**
- ✅ Freelancer userIds who are online
- ❌ No private data (socketId, chattingWith, lastActive, role, etc.)
- ❌ No client presence (only freelancers)

**What Authenticated Users See:**
- ✅ All online users (clients + freelancers)
- ✅ Full presence data (socketId, role, lastActive, chattingWith)

### **Implementation Details**

**Server** (`lib/socket.js`):
```javascript
// Public namespace (no auth)
const publicNamespace = io.of('/presence');

// Broadcast public presence (freelancers only)
const broadcastPublicPresenceUpdate = () => {
  const onlineFreelancerIds = Array.from(onlineUsers.entries())
    .filter(([userId, data]) => data.role === 'FREELANCER')
    .map(([userId]) => userId);
  
  publicNamespace.emit('presence:update', {
    onlineFreelancerIds,
    timestamp: new Date().toISOString(),
  });
};

// Called when freelancer connects/disconnects
broadcastPublicPresenceUpdate();
```

**Client** (`hooks/usePublicPresence.js`):
```javascript
// Connects to /presence namespace (no auth)
const socketInstance = io(`${socketUrl}/presence`, {
  path: '/api/socket',
  transports: ['websocket', 'polling'],
});

// Receives freelancer IDs only
socketInstance.on('presence:update', (data) => {
  updateOnlineFreelancers(data.onlineFreelancerIds);
});
```

**Component** (`components/chat/UserStatus.jsx`):
```javascript
// Checks both stores based on login status
const status = isLoggedIn 
  ? getAuthStatus(userId, currentUser?.id)  // Full data
  : getPublicStatus(userId);                  // Freelancer IDs only
```

---

## Summary

The online/offline status system is a **real-time, event-driven** system that:

1. ✅ Tracks users when they connect/disconnect via Socket.IO
2. ✅ Broadcasts presence updates to all clients instantly (authenticated + public)
3. ✅ Updates UI components automatically via Zustand stores
4. ✅ Shows accurate status without polling
5. ✅ Handles reconnections automatically
6. ✅ **Public presence for guest users (freelancers only, no private data)**

**Status Logic**: 
- 🟢 **Online** = User exists in `onlineUsers` Map (socket connected)
- ⚫ **Offline** = User not in `onlineUsers` Map (socket disconnected)

**For Guest Users**:
- 🟢 **Online** = Freelancer userId exists in `onlineFreelancerIds` Set
- ⚫ **Offline** = Freelancer userId not in Set

