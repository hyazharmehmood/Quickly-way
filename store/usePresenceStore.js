"use client";

import { create } from 'zustand';

/**
 * Global presence store to track online users
 * Structure: userId => { socketId, role, lastActive, chattingWith }
 */
const usePresenceStore = create((set, get) => ({
  onlineUsers: new Map(), // userId => { socketId, role, lastActive, chattingWith }
  
  // Update online users from server
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

  // Get user status - only online or offline (no active status)
  getUserStatus: (userId, currentUserId) => {
    const { onlineUsers } = get();
    const user = onlineUsers.get(userId);
    
    // If user is in onlineUsers map, they are online (socket connected)
    // If not in map, they are offline (socket disconnected)
    return user ? 'online' : 'offline';
  },

  // Check if user is online
  isUserOnline: (userId) => {
    const { onlineUsers } = get();
    return onlineUsers.has(userId);
  },

  // Get online user data
  getOnlineUser: (userId) => {
    const { onlineUsers } = get();
    return onlineUsers.get(userId) || null;
  },

  // Get all online users
  getAllOnlineUsers: () => {
    const { onlineUsers } = get();
    return Array.from(onlineUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  },
}));

export default usePresenceStore;

