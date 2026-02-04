"use client";

import React from 'react';
import usePresenceStore from '@/store/usePresenceStore';
import usePublicPresenceStore from '@/store/usePublicPresenceStore';
import useAuthStore from '@/store/useAuthStore';

/**
 * UserStatus component - Shows user online status
 * Status logic:
 * - 🟢 Online: User socket is connected (logged in and connected)
 * - ⚫ Offline: User socket is disconnected (logged out or disconnected)
 * 
 * For authenticated users: Uses usePresenceStore (full data)
 * For guest users: Uses usePublicPresenceStore (freelancer IDs only)
 */
export function UserStatus({ userId, showLabel = false, size = 'sm' }) {
  const { getUserStatus: getAuthStatus } = usePresenceStore();
  const { getUserStatus: getPublicStatus } = usePublicPresenceStore();
  const { user: currentUser, isLoggedIn } = useAuthStore();
  
  // Use authenticated store if logged in, otherwise use public store
  const status = isLoggedIn 
    ? getAuthStatus(userId, currentUser?.id)
    : getPublicStatus(userId);
  
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
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${config.color} ${sizeClasses[size]} rounded-full`} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}

