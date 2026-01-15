"use client";

import React from 'react';
import { Circle } from 'lucide-react';
import usePresenceStore from '@/store/usePresenceStore';
import useAuthStore from '@/store/useAuthStore';

/**
 * UserStatus component - Shows user online status
 * Status logic:
 * - 🟢 Online: User online AND chatting with me
 * - 🟡 Active: User online only
 * - ⚫ Offline: User not online
 */
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
    active: {
      color: 'bg-yellow-500',
      label: 'Active',
      icon: '🟡',
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

