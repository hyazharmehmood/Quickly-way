import { create } from 'zustand';

/** Minimal conversation shape for dropdown: id, otherParticipant, lastMessageText, unreadCount, lastMessageAt */
function toUnreadItem(c) {
  const n = c.unreadCount || 0;
  if (n < 1) return null;
  return {
    id: c.id,
    otherParticipant: c.otherParticipant || {},
    lastMessageText: c.lastMessageText || c.lastMessage?.content,
    unreadCount: n,
    lastMessageAt: c.lastMessageAt || c.lastMessage?.createdAt,
  };
}

const useChatUnreadStore = create((set, get) => ({
  totalUnread: 0,
  /** conversationId -> unreadCount for delta updates from conversation:updated */
  conversationUnreads: {},
  /** Conversations with unread for chat dropdown (same source as badge) */
  conversationsWithUnread: [],
  setTotalUnread: (totalUnread) => set({ totalUnread }),
  setConversationsUnread: (conversations) => {
    const conversationUnreads = {};
    let totalUnread = 0;
    const withUnread = [];
    (conversations || []).forEach((c) => {
      const n = c.unreadCount || 0;
      conversationUnreads[c.id] = n;
      totalUnread += n;
      const item = toUnreadItem(c);
      if (item) withUnread.push(item);
    });
    set({ conversationUnreads, totalUnread, conversationsWithUnread: withUnread });
  },
  applyConversationUpdated: (conversation) => {
    const { conversationUnreads, conversationsWithUnread } = get();
    const prev = conversationUnreads[conversation.id] || 0;
    const next = conversation.unreadCount ?? 0;
    const nextTotal = get().totalUnread - prev + next;
    const item = toUnreadItem(conversation);
    const rest = conversationsWithUnread.filter((x) => x.id !== conversation.id);
    const nextWithUnread = item ? [item, ...rest] : rest;
    set({
      conversationUnreads: { ...conversationUnreads, [conversation.id]: next },
      totalUnread: nextTotal,
      conversationsWithUnread: nextWithUnread,
    });
  },
}));

export default useChatUnreadStore;
