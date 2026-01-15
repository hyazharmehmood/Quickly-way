"use client";

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/useAuthStore';
import usePresenceStore from '@/store/usePresenceStore';

/**
 * Global Socket.IO hook that connects immediately on login
 * This should be used at the app level, not just in chat components
 */
export function useGlobalSocket() {
  const { token, isLoggedIn, user } = useAuthStore();
  const { updateOnlineUsers } = usePresenceStore();
  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const connectTimeoutRef = useRef(null);

  useEffect(() => {
    // Only connect if user is logged in AND has valid token
    // This prevents connection attempts during login process
    if (!isLoggedIn || !token || !user) {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket (user logged out)');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Clear heartbeat if exists
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      // Clear any pending connection timeout
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      return;
    }

    // If already connected, don't reconnect
    if (socketRef.current?.connected) {
      return;
    }

    // Small delay (500ms) to ensure login API completes first
    // This prevents Socket.IO from interfering with the login request
    connectTimeoutRef.current = setTimeout(() => {
      // Double-check user is still logged in after delay
      if (!isLoggedIn || !token || !user) {
        return;
      }

      console.log('🔄 Global Socket.IO: Initializing connection...', {
        userId: user.id,
        url: process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin,
      });

      // Initialize Socket.IO client
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
      const socketInstance = io(socketUrl, {
        path: '/api/socket',
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socketInstance;

      // Connection events
      socketInstance.on('connect', () => {
        console.log('✅ Global Socket.IO Connected!', {
          id: socketInstance.id,
          userId: user.id,
          transport: socketInstance.io.engine.transport.name,
        });

        // Start heartbeat (every 25 seconds)
        heartbeatIntervalRef.current = setInterval(() => {
          if (socketInstance.connected) {
            socketInstance.emit('heartbeat');
          }
        }, 25000);

        // Send initial heartbeat
        socketInstance.emit('heartbeat');
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ Global Socket.IO Disconnected:', reason);
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      });

      socketInstance.on('connect_error', (err) => {
        console.error('❌ Global Socket.IO Connection Error:', err.message);
      });

      // Presence events
      socketInstance.on('presence:connected', (data) => {
        console.log('👥 Presence: Initial online users received', data.onlineUsers.length);
        updateOnlineUsers(data.onlineUsers);
      });

      socketInstance.on('presence:update', (data) => {
        console.log('👥 Presence: Online users updated', data.onlineUsers.length);
        updateOnlineUsers(data.onlineUsers);
      });
    }, 500); // 500ms delay to ensure login completes

    // Cleanup on unmount or logout
    return () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isLoggedIn, token, user?.id, updateOnlineUsers]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };
}
