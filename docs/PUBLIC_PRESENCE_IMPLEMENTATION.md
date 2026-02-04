# Public Presence Implementation Summary

## Overview

This document explains the implementation of public presence for guest users, allowing them to see freelancer online status (Fiverr-style behavior) without requiring authentication.

## Architecture Decision

**Chosen Approach: Socket.IO Public Namespace (`/presence`)**

**Why this approach:**
1. ✅ **Real-time updates** - Event-driven, no polling needed
2. ✅ **Single source of truth** - Uses same `onlineUsers` Map on server
3. ✅ **No additional infrastructure** - No Redis required
4. ✅ **Scalable** - Socket.IO handles connection management
5. ✅ **Clean separation** - Public namespace isolated from authenticated namespace

**Alternatives considered:**
- ❌ REST endpoint + Redis: Would require Redis infrastructure, polling, or WebSocket setup anyway
- ❌ Database polling: Not real-time, adds database load
- ❌ Separate Socket.IO server: Unnecessary complexity

## Data Flow

### 1. Server-Side (`lib/socket.js`)

**Public Namespace Setup:**
```javascript
const publicNamespace = io.of('/presence');
// No authentication middleware - open to all
```

**Broadcasting:**
- When a freelancer connects/disconnects:
  1. Update `onlineUsers` Map (single source of truth)
  2. Broadcast to authenticated namespace (full data)
  3. Broadcast to public namespace (freelancer IDs only)

**Privacy Filter:**
```javascript
const onlineFreelancerIds = Array.from(onlineUsers.entries())
  .filter(([userId, data]) => data.role === 'FREELANCER')
  .map(([userId]) => userId);
// Only sends userId, no private data
```

### 2. Client-Side (Guest Users)

**Hook** (`hooks/usePublicPresence.js`):
- Connects to `/presence` namespace (no auth token)
- Listens for `presence:connected` and `presence:update` events
- Updates lightweight store with freelancer IDs

**Store** (`store/usePublicPresenceStore.js`):
- Lightweight: Only stores Set of freelancer userIds
- No private data stored
- Methods: `isFreelancerOnline()`, `getUserStatus()`, `getAllOnlineFreelancers()`

**Component** (`components/chat/UserStatus.jsx`):
- Checks login status
- If logged in: Uses `usePresenceStore` (full data)
- If guest: Uses `usePublicPresenceStore` (freelancer IDs only)

### 3. Initialization

**AuthInitializer** (`components/auth/AuthInitializer.jsx`):
- Initializes both hooks:
  - `useGlobalSocket()` - For authenticated users
  - `usePublicPresence()` - For all users (including guests)
- Both hooks run simultaneously, but only relevant one is used based on login status

## Data Privacy

### What Guest Users Receive:
- ✅ Array of freelancer userIds who are online
- ❌ No private data (socketId, chattingWith, lastActive, role, etc.)
- ❌ No client presence (only freelancers)

### What Authenticated Users Receive:
- ✅ All online users (clients + freelancers)
- ✅ Full presence data (socketId, role, lastActive, chattingWith)

## Key Features

1. **Single Source of Truth**: Same `onlineUsers` Map used for both authenticated and public presence
2. **Real-Time**: Updates broadcast instantly when freelancers connect/disconnect
3. **No Polling**: Event-driven architecture
4. **Privacy-First**: Guest users only see freelancer IDs, no private data
5. **Backward Compatible**: Existing authenticated flow unchanged
6. **Automatic Reconnection**: Socket.IO handles network issues

## Usage Examples

### Check if Freelancer is Online (Guest User)
```javascript
import usePublicPresenceStore from '@/store/usePublicPresenceStore';

const { isFreelancerOnline } = usePublicPresenceStore();
const isOnline = isFreelancerOnline(freelancerId);
```

### Display Status in Component
```jsx
import { UserStatus } from '@/components/chat/UserStatus';

// Works for both authenticated and guest users
<UserStatus userId={freelancerId} size="sm" />
```

### Filter Gigs by Online Status
```javascript
import usePublicPresenceStore from '@/store/usePublicPresenceStore';

const { isFreelancerOnline } = usePublicPresenceStore();
const onlineGigs = gigs.filter(gig => isFreelancerOnline(gig.freelancerId));
```

## Testing Checklist

- [ ] Guest user sees freelancer online status
- [ ] Guest user sees freelancer go offline in real-time
- [ ] Authenticated user still sees full presence data
- [ ] No private data leaked to guest users
- [ ] Reconnection works for public namespace
- [ ] Multiple guest users receive updates simultaneously
- [ ] ServiceCard shows correct status for guest users

## Performance Considerations

- **Memory**: Public store uses Set (O(1) lookup) - very efficient
- **Network**: Only sends freelancer IDs array (minimal data)
- **Server**: Single broadcast to public namespace (efficient)
- **Scalability**: Socket.IO handles connection pooling and scaling

## Future Enhancements

- Optional: Add "recently active" fallback (last 5 minutes) for edge cases
- Optional: Add rate limiting for public namespace connections
- Optional: Add analytics for public presence usage

