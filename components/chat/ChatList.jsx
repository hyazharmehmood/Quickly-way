"use client";

import React, { useEffect, useState } from 'react';
import { Search, MessageSquare, Loader2, Bell } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import moment from 'moment';
import { cn } from "@/utils";
// Removed API import - using Socket.IO only
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import { UserStatus } from './UserStatus';
import useAuthStore from '@/store/useAuthStore';
// Removed useSocket - using useGlobalSocket only


export function ChatList({ onSelectConversation, selectedConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'starred'
  const { socket, isConnected } = useGlobalSocket();
  const { user } = useAuthStore();

  useEffect(() => {
    if (socket && isConnected) {
      fetchConversations();
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for conversation updates (when lastMessage changes)
    const handleConversationUpdated = (data) => {
      const { conversation } = data;
      console.log('conversation', conversation);
      console.log('📬 Conversation updated received:', {
        id: conversation.id,
        lastMessageText: conversation.lastMessageText,
        lastMessageAt: conversation.lastMessageAt,
        hasLastMessage: !!conversation.lastMessage,
      });
      
      setConversations((prev) => {
        // Check if conversation exists
        const existingIndex = prev.findIndex((c) => c.id === conversation.id);
        
        if (existingIndex !== -1) {
          // Update existing conversation - prioritize incoming data
          const updated = [...prev];
          const existingConv = updated[existingIndex];
          
          // Use incoming lastMessage if available, otherwise create from denormalized fields
          const lastMessage = conversation.lastMessage || (conversation.lastMessageText ? {
            id: 'denormalized',
            content: conversation.lastMessageText,
            senderId: conversation.lastSenderId,
            createdAt: conversation.lastMessageAt,
            sender: conversation.participants?.find((p) => p.userId === conversation.lastSenderId)?.user || null,
          } : existingConv.lastMessage);
          
          // Merge: incoming data takes priority, but preserve existing data if incoming is missing
          updated[existingIndex] = {
            ...existingConv,
            ...conversation,
            // Explicitly ensure denormalized fields are updated
            lastMessageText: conversation.lastMessageText ?? existingConv.lastMessageText,
            lastMessageAt: conversation.lastMessageAt ?? existingConv.lastMessageAt,
            lastSenderId: conversation.lastSenderId ?? existingConv.lastSenderId,
            updatedAt: conversation.updatedAt ?? conversation.lastMessageAt ?? existingConv.updatedAt,
            lastMessage: lastMessage,
            // Preserve otherParticipant if not in update
            otherParticipant: conversation.otherParticipant ?? existingConv.otherParticipant,
            // Update unreadCount - if explicitly 0, use it; otherwise use existing or incoming
            unreadCount: conversation.unreadCount !== undefined ? conversation.unreadCount : existingConv.unreadCount,
          };
          
          console.log('✅ Updated conversation:', {
            id: updated[existingIndex].id,
            lastMessageText: updated[existingIndex].lastMessageText,
            lastMessageContent: updated[existingIndex].lastMessage?.content,
          });
          
          // Always move to top when conversation is updated (new message received)
          return [
            updated[existingIndex],
            ...updated.filter((_, idx) => idx !== existingIndex),
          ];
        } else {
          // Add new conversation to top
          return [conversation, ...prev];
        }
      });
    };

    // Listen for new messages (for real-time updates)
    // This provides instant UI feedback before conversation:updated arrives
    const handleNewMessage = (data) => {
      const { message, conversationId } = data;
      
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === conversationId) {
            // Update lastMessage immediately for instant feedback
            // The conversation:updated event will provide the complete update with unreadCount
            return {
              ...conv,
              lastMessage: message,
              lastMessageText: message.content,
              lastMessageAt: message.createdAt,
              lastSenderId: message.senderId,
              updatedAt: message.createdAt,
              // Don't update unreadCount here - wait for conversation:updated event
            };
          }
          return conv;
        });

        // Move updated conversation to top
        const updatedConv = updated.find((c) => c.id === conversationId);
        if (updatedConv) {
          return [
            updatedConv,
            ...updated.filter((c) => c.id !== conversationId),
          ];
        }
        return updated;
      });
    };

    // Listen for new conversation created
    const handleNewConversation = (data) => {
      if (data.conversation) {
        setConversations((prev) => {
          // Check if conversation already exists
          const exists = prev.find((c) => c.id === data.conversation.id);
          if (exists) {
            return prev;
          }
          // Add new conversation to the top
          return [{ ...data.conversation, unreadCount: 0 }, ...prev];
        });
      }
    };

    // Listen for messages read (decrease unread count)
    const handleMessagesRead = (data) => {
      const { conversationId } = data;
      
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: 0,
            };
          }
          return conv;
        });
      });
    };

    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('new_message', handleNewMessage);
    socket.on('conversation:created', handleNewConversation);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('new_message', handleNewMessage);
      socket.off('conversation:created', handleNewConversation);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, isConnected]);

  const fetchConversations = () => {
    if (!socket || !isConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // Request conversations via Socket.IO
    socket.emit('get_conversations');

    // Listen for response
    const handleConversationsFetched = (data) => {
      setConversations(data.conversations || []);
      setLoading(false);
    };

    socket.once('conversations:fetched', handleConversationsFetched);

    // Also listen for errors
    const handleError = (error) => {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    };

    socket.once('error', handleError);

    // Cleanup listeners
    return () => {
      socket.off('conversations:fetched', handleConversationsFetched);
      socket.off('error', handleError);
    };
  };

  const filteredConversations = conversations.filter((conv) => {
    // Apply search filter
    if (searchQuery) {
      const otherUser = conv.otherParticipant;
      if (!otherUser) return false;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        otherUser.name?.toLowerCase().includes(searchLower) ||
        otherUser.email?.toLowerCase().includes(searchLower) ||
        conv.lastMessageText?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Apply filter tabs
    if (filter === 'unread') {
      return (conv.unreadCount || 0) > 0;
    }
    if (filter === 'starred') {
      // TODO: Implement starred functionality
      return false;
    }
    
    return true; // 'all' filter
  });

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          <div className="relative mb-4">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Format timestamp for display
  const formatTimestamp = (date) => {
    if (!date) return '';
    const now = moment();
    const messageTime = moment(date);
    
    if (now.diff(messageTime, 'minutes') < 1) {
      return 'Now';
    } else if (now.diff(messageTime, 'hours') < 24) {
      return messageTime.format('h:mm A');
    } else if (now.diff(messageTime, 'days') < 1) {
      return 'Yesterday';
    } else {
      return messageTime.format('MMM D');
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header with Inbox and Bell */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-normal text-foreground">Inbox</h3>
          {/* <Bell className="w-5 h-5 text-muted-foreground" /> */}
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name"
            className="pl-10   "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === 'all' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === 'unread' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('starred')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === 'starred' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            Starred
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 flex flex-col items-center justify-center text-muted-foreground opacity-50 h-full">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-sm font-normal">
              {searchQuery ? 'No conversations found' : 'No active conversations'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.otherParticipant;
              // Use lastMessage if available, otherwise create from denormalized fields
              const lastMessage = conversation.lastMessage || (conversation.lastMessageText ? {
                id: 'denormalized',
                content: conversation.lastMessageText,
                senderId: conversation.lastSenderId,
                createdAt: conversation.lastMessageAt,
                sender: conversation.participants?.find((p) => p.userId === conversation.lastSenderId)?.user || null,
              } : null);
              const isSelected = selectedConversationId === conversation.id;
              const unreadCount = conversation.unreadCount || 0;

              const isOwnMessage = lastMessage?.senderId === user?.id;
              const messagePreview = lastMessage 
                ? (isOwnMessage ? `You: ${lastMessage.content}` : lastMessage.content)
                : 'Start a conversation';

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-secondary/50 transition-colors",
                    isSelected && "bg-green-50 dark:bg-green-950/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser?.profileImage} alt={otherUser?.name} />
                        <AvatarFallback>
                          {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser?.id && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <UserStatus userId={otherUser.id} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="font-medium text-sm truncate">
                          {otherUser?.name || 'Unknown User'}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(lastMessage.createdAt)}
                            </span>
                          )}
                          {unreadCount > 0 && !isSelected && (
                            <Badge 
                              variant="default" 
                              className="h-5 min-w-5 px-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-full"
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {messagePreview}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

