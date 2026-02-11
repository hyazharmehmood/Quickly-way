import { useEffect, useRef } from 'react';
import api from '@/utils/api';
import useNotificationStore from '@/store/useNotificationStore';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import useAuthStore from '@/store/useAuthStore';

export function useNotifications() {
  const { socket } = useGlobalSocket();
  const { isLoggedIn, user } = useAuthStore();
  const currentUserId = user?.id;
  const prevUserIdRef = useRef(null);
  const {
    notifications,
    unreadCount,
    setNotifications,
    addNotification,
    markAsReadLocal,
    initialized,
    reset,
  } =
    useNotificationStore();

  // On logout: clear store. After login or account switch: clear so we always fetch fresh (Header isn't mounted on login page, so store can be stale).
  useEffect(() => {
    if (!isLoggedIn) {
      prevUserIdRef.current = null;
      reset();
      return;
    }
    // Reset when just logged in (prev was null) or when switched to a different user — then we will re-fetch below.
    const justLoggedIn = prevUserIdRef.current === null;
    const switchedUser = prevUserIdRef.current !== null && prevUserIdRef.current !== currentUserId;
    if (currentUserId && (justLoggedIn || switchedUser)) {
      reset();
    }
    prevUserIdRef.current = currentUserId ?? null;
  }, [isLoggedIn, currentUserId, reset]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    if (initialized) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications?limit=20');
        setNotifications(response.data.items || [], response.data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchNotifications();
  }, [isLoggedIn, initialized, setNotifications]);

  // Only add real-time notifications that belong to the current user (bell = my notifications only)
  useEffect(() => {
    if (!socket || !currentUserId) return;
    const handler = (notification) => {
      if (notification?.userId !== currentUserId) return;
      addNotification(notification);
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [socket, currentUserId, addNotification]);

  const markAsRead = async (ids) => {
    if (!ids.length) return;
    markAsReadLocal(ids);
    try {
      await api.patch('/notifications', { ids });
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
  };
}
