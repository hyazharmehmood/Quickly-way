"use client";

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import usePublicPresenceStore from '@/store/usePublicPresenceStore';

// ============================================================================
// Global Public Presence Socket State - Shared across all components
// ============================================================================
let globalPublicSocket = null;
let __publicPresenceListenersAdded = false;

/**
 * Public Presence hook for guest users (no authentication required)
 * 
 * Features:
 * - Connects to public /presence namespace
 * - Tracks online freelancer IDs only (no private data)
 * - Works without login
 * - Automatic reconnection
 * 
 * Usage:
 *   const { isConnected } = usePublicPresence();
 * 
 * @returns {Object} { isConnected }
 */
export function usePublicPresence() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // --------------------------------------------------------------------------
    // Already Connected - Just update state
    // --------------------------------------------------------------------------
    if (globalPublicSocket?.connected) {
      setIsConnected(true);
      return;
    }

    // --------------------------------------------------------------------------
    // Socket Exists But Not Connected - Wait for reconnection
    // --------------------------------------------------------------------------
    if (globalPublicSocket && !globalPublicSocket.connected) {
      setIsConnected(false);
      return;
    }

    // --------------------------------------------------------------------------
    // Initialize New Connection
    // --------------------------------------------------------------------------
    if (globalPublicSocket) {
      return; // Already initializing or exists
    }

    // Initialize Socket.IO client to public namespace
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socketInstance = io(`${socketUrl}/presence`, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
    });

    globalPublicSocket = socketInstance;

    // ------------------------------------------------------------------------
    // Connection Event Handlers
    // ------------------------------------------------------------------------
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    // ------------------------------------------------------------------------
    // Presence Event Handlers - Use getState() to avoid stale closure
    // ------------------------------------------------------------------------
    if (!__publicPresenceListenersAdded) {
      socketInstance.on('presence:connected', (data) => {
        if (data?.onlineFreelancerIds) {
          usePublicPresenceStore.getState().updateOnlineFreelancers(data.onlineFreelancerIds);
        }
      });

      socketInstance.on('presence:update', (data) => {
        if (data?.onlineFreelancerIds) {
          usePublicPresenceStore.getState().updateOnlineFreelancers(data.onlineFreelancerIds);
        }
      });

      __publicPresenceListenersAdded = true;
    }

    // --------------------------------------------------------------------------
    // Cleanup: Don't disconnect socket when component unmounts
    // Socket should persist across page navigations
    // --------------------------------------------------------------------------
    return () => {
      // No cleanup needed here - socket persists across navigations
    };
  }, []);

  // ============================================================================
  // Connection Status Management
  // ============================================================================
  useEffect(() => {
    if (!globalPublicSocket) {
      setIsConnected(false);
      return;
    }

    // Set initial connection state
    setIsConnected(globalPublicSocket.connected);
    
    // Listen for connection state changes via events
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    globalPublicSocket.on('connect', handleConnect);
    globalPublicSocket.on('disconnect', handleDisconnect);
    
    return () => {
      if (globalPublicSocket) {
        globalPublicSocket.off('connect', handleConnect);
        globalPublicSocket.off('disconnect', handleDisconnect);
      }
    };
  }, []);

  // ============================================================================
  // Return connection status
  // ============================================================================
  return {
    isConnected: globalPublicSocket?.connected || false,
  };
}

