"use client";

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/useAuthStore';
import usePresenceStore from '@/store/usePresenceStore';

// ============================================================================
// Global Socket State - Shared across all components
// ============================================================================
let globalSocket = null;
let globalHeartbeatInterval = null;
let globalConnectTimeout = null;
let connectionListeners = new Set(); // Track components using the socket
let __presenceListenersAdded = false; // Flag to ensure presence listeners are added only once

/**
 * Global Socket.IO hook that connects immediately on login
 * 
 * Features:
 * - Single shared socket instance across all components
 * - Persistent connection across page navigations
 * - Automatic reconnection on network issues
 * - Heartbeat to maintain connection
 * - Presence tracking for online users
 * 
 * Usage:
 *   const { socket, isConnected } = useGlobalSocket();
 * 
 * @returns {Object} { socket, isConnected }
 */
export function useGlobalSocket() {
  const { token, isLoggedIn, user } = useAuthStore();
  const { updateOnlineUsers } = usePresenceStore();
  const [isConnected, setIsConnected] = useState(false);
  const listenerId = useRef(Math.random().toString(36).substring(7));

  // ============================================================================
  // Component Registration - Track which components are using the socket
  // ============================================================================
  useEffect(() => {
    connectionListeners.add(listenerId.current);
    return () => {
      connectionListeners.delete(listenerId.current);
    };
  }, []);

  // ============================================================================
  // Socket Connection Management
  // ============================================================================
  useEffect(() => {
    // --------------------------------------------------------------------------
    // Logout Handler - Clean up socket and timers
    // --------------------------------------------------------------------------
    if (!isLoggedIn || !token || !user) {
      // Disconnect socket immediately when user logs out
      if (globalSocket) {
        console.log('🔌 Disconnecting socket (user logged out)');
        globalSocket.disconnect();
        globalSocket = null;
      }
      
      // Clear heartbeat interval - CRITICAL: Prevents memory leaks
      if (globalHeartbeatInterval) {
        clearInterval(globalHeartbeatInterval);
        globalHeartbeatInterval = null;
      }
      
      // Clear any pending connection timeout
      if (globalConnectTimeout) {
        clearTimeout(globalConnectTimeout);
        globalConnectTimeout = null;
      }
      
      // Reset presence listeners flag
      __presenceListenersAdded = false;
      
      setIsConnected(false);
      return;
    }

    // --------------------------------------------------------------------------
    // Already Connected - Just update state
    // --------------------------------------------------------------------------
    if (globalSocket?.connected) {
      setIsConnected(true);
      return;
    }

    // --------------------------------------------------------------------------
    // Socket Exists But Not Connected - Wait for reconnection
    // --------------------------------------------------------------------------
    if (globalSocket && !globalSocket.connected) {
      setIsConnected(false);
      return;
    }

    // --------------------------------------------------------------------------
    // Initialize New Connection
    // --------------------------------------------------------------------------
    // Strict guard: Prevent multiple connection timers
    // This ensures only one connection attempt is scheduled at a time
    if (globalConnectTimeout !== null) {
      return; // Connection already in progress
    }

    // Small delay (500ms) to ensure login API completes first
    // This prevents Socket.IO from interfering with the login request
    globalConnectTimeout = setTimeout(() => {
      // Clear timeout reference immediately to allow future connections
      globalConnectTimeout = null;

      // Double-check user is still logged in after delay
      if (!isLoggedIn || !token || !user) {
        return;
      }

      // If socket already exists, don't create a new one
      if (globalSocket) {
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

      globalSocket = socketInstance;

      // ------------------------------------------------------------------------
      // Connection Event Handlers
      // ------------------------------------------------------------------------
      socketInstance.on('connect', () => {
        console.log('✅ Global Socket.IO Connected!', {
          id: socketInstance.id,
          userId: user.id,
          transport: socketInstance.io.engine.transport.name,
        });

        // Start heartbeat (every 25 seconds) - only if not already started
        if (!globalHeartbeatInterval) {
          globalHeartbeatInterval = setInterval(() => {
            if (socketInstance.connected) {
              socketInstance.emit('heartbeat');
            }
          }, 25000);
        }

        // Send initial heartbeat
        socketInstance.emit('heartbeat');
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ Global Socket.IO Disconnected:', reason);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('❌ Global Socket.IO Connection Error:', err.message);
      });

      // ------------------------------------------------------------------------
      // Presence Event Handlers - Set up only once using flag
      // ------------------------------------------------------------------------
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
    }, 500); // 500ms delay to ensure login completes

    // --------------------------------------------------------------------------
    // Cleanup: Don't disconnect socket when component unmounts
    // Socket should persist across page navigations until user logs out
    // --------------------------------------------------------------------------
    return () => {
      // No cleanup needed here - socket persists across navigations
      // Only disconnects when user logs out (handled above)
    };
  }, [isLoggedIn, token, user?.id, updateOnlineUsers]);

  // ============================================================================
  // Connection Status Management - Simplified using events only
  // ============================================================================
  useEffect(() => {
    if (!globalSocket) {
      setIsConnected(false);
      return;
    }

    // Set initial connection state
    setIsConnected(globalSocket.connected);
    
    // Listen for connection state changes via events
    // This is simpler and more reliable than polling or multiple setState calls
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    globalSocket.on('connect', handleConnect);
    globalSocket.on('disconnect', handleDisconnect);
    
    return () => {
      if (globalSocket) {
        globalSocket.off('connect', handleConnect);
        globalSocket.off('disconnect', handleDisconnect);
      }
    };
  }, [isLoggedIn, token]); // Re-run when login state or token changes

  // ============================================================================
  // Return socket instance and connection status
  // ============================================================================
  return {
    socket: globalSocket,
    isConnected: globalSocket?.connected || false,
  };
}
