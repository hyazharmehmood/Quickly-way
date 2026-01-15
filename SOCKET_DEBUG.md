# Socket.IO Connection Debugging Guide

## How to Check Socket.IO Connection Status

### 1. **Browser Console (Client-Side)**

Open your browser's Developer Tools (F12) and check the Console tab. You should see:

**✅ When Connected:**
```
✅ Socket.IO Connected! {id: "abc123...", transport: "websocket"}
```

**❌ When Disconnected:**
```
❌ Socket.IO Disconnected: transport close
```

**❌ Connection Errors:**
```
❌ Socket.IO Connection Error: {message: "...", type: "...", description: "..."}
```

### 2. **Server Console (Server-Side)**

Check your terminal where `npm run dev` is running. You should see:

**✅ When User Connects:**
```
✅ Socket.IO: User <userId> (<userName>) connected {socketId: "...", transport: "websocket"}
```

**❌ When User Disconnects:**
```
❌ Socket.IO: User <userId> disconnected {reason: "...", socketId: "..."}
```

### 3. **Visual Status Indicator**

The chat window now displays a connection status badge in the header:
- 🟢 **Green Badge**: Connected (shows socket ID)
- 🔴 **Red Badge**: Error (shows error message)
- ⚪ **Gray Badge**: Connecting/Disconnected

### 4. **Manual Connection Test**

You can test the connection manually in the browser console:

```javascript
// Check if socket is connected
const socket = window.socket; // If you expose it globally
console.log('Connected:', socket?.connected);
console.log('Socket ID:', socket?.id);

// Or use the hook in a component
import { useSocket } from '@/hooks/useSocket';
const { socket, isConnected, error } = useSocket();
console.log({ isConnected, error, socketId: socket?.id });
```

### 5. **Network Tab**

1. Open Developer Tools → Network tab
2. Filter by "WS" (WebSocket) or "socket.io"
3. You should see a connection to `/api/socket`
4. Status should be "101 Switching Protocols" for WebSocket

### 6. **Common Issues & Solutions**

#### Issue: "Connection Error: Authentication error"
**Solution:** 
- Check if user is logged in
- Verify JWT token is valid
- Check server logs for authentication errors

#### Issue: "Connection Error: CORS"
**Solution:**
- Verify `NEXT_PUBLIC_SOCKET_URL` in `.env` matches your server URL
- Check CORS settings in `lib/socket.js`
- Ensure server is running on the correct port (3000)

#### Issue: "Connection Error: Network"
**Solution:**
- Verify server is running: `npm run dev`
- Check if port 3000 is available
- Verify firewall/network settings

#### Issue: Socket connects but immediately disconnects
**Solution:**
- Check server logs for authentication errors
- Verify database connection
- Check if Prisma client is initialized

### 7. **Testing Connection Programmatically**

Add this to any component to test:

```jsx
import { useSocket } from '@/hooks/useSocket';
import { useEffect } from 'react';

function TestConnection() {
  const { socket, isConnected, error } = useSocket();

  useEffect(() => {
    if (socket) {
      console.log('Socket instance:', socket);
      console.log('Connected:', socket.connected);
      console.log('Socket ID:', socket.id);
      
      // Test emit
      socket.emit('test', { message: 'Hello' });
    }
  }, [socket]);

  return (
    <div>
      <p>Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      {error && <p>Error: {error}</p>}
      {socket && <p>Socket ID: {socket.id}</p>}
    </div>
  );
}
```

### 8. **Server-Side Connection Check**

The server logs all connection events. Check for:
- User connection messages
- Authentication errors
- Room join/leave events
- Message send/receive events

### 9. **Environment Variables**

Make sure these are set in `.env`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 10. **Quick Connection Test**

1. Start server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Login to your account
4. Navigate to `/messages` page
5. Check browser console for connection logs
6. Check server terminal for connection logs
7. Look for the status badge in the chat header

If you see ✅ in both console and UI, your Socket.IO is working!

