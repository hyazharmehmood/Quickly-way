"use client";

import { create } from 'zustand';

/**
 * Public presence store for guest users
 * Lightweight store that only tracks online freelancer userIds (Set)
 * No private data - only public online/offline status
 */
const usePublicPresenceStore = create((set, get) => ({
  onlineFreelancerIds: new Set(), // Set of freelancer userIds who are online
  
  // Update online freelancer IDs from server
  updateOnlineFreelancers: (freelancerIds) => {
    const freelancerSet = new Set(freelancerIds);
    set({ onlineFreelancerIds: freelancerSet });
  },
  
  // Check if a freelancer is online
  isFreelancerOnline: (userId) => {
    const { onlineFreelancerIds } = get();
    return onlineFreelancerIds.has(userId);
  },
  
  // Get user status (for compatibility with UserStatus component)
  getUserStatus: (userId) => {
    const { onlineFreelancerIds } = get();
    return onlineFreelancerIds.has(userId) ? 'online' : 'offline';
  },
  
  // Get all online freelancer IDs
  getAllOnlineFreelancers: () => {
    const { onlineFreelancerIds } = get();
    return Array.from(onlineFreelancerIds);
  },
}));

export default usePublicPresenceStore;

