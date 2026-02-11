import { create } from 'zustand';

const MAX_NOTIFICATIONS = 50;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  initialized: false,
  /** Set when a new notification is pushed via socket (for global toast); clear after showing */
  lastAddedId: null,

  setNotifications: (items, unreadCount) =>
    set({
      notifications: items,
      unreadCount,
      initialized: true,
    }),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      initialized: false,
      lastAddedId: null,
    }),

  addNotification: (notification) =>
    set((state) => {
      const items = [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
      return {
        notifications: items,
        unreadCount: state.unreadCount + 1,
        lastAddedId: notification.id,
      };
    }),

  clearLastAddedId: () => set({ lastAddedId: null }),

  markAsReadLocal: (ids) =>
    set((state) => {
      const setIds = new Set(ids);
      const items = state.notifications.map((notification) =>
        setIds.has(notification.id) ? { ...notification, read: true } : notification
      );
      const unreadCount = items.filter((n) => !n.read).length;
      return {
        notifications: items,
        unreadCount,
      };
    }),
}));

export default useNotificationStore;
