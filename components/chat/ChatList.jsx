"use client";

import React, { useEffect, useState } from 'react';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
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
// Removed useSocket - using useGlobalSocket only


export function ChatList({ onSelectConversation, selectedConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { socket, isConnected } = useGlobalSocket();

  useEffect(() => {
    if (socket && isConnected) {
      fetchConversations();
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    socket.on('new_message', (data) => {
      const { message, conversationId } = data;
      
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt,
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
    });

    socket.on('new_message_notification', (data) => {
      const { message, conversationId } = data;
      
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt,
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
    });

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
          return [data.conversation, ...prev];
        });
      }
    };

    socket.on('conversation:created', handleNewConversation);

    return () => {
      socket.off('new_message');
      socket.off('new_message_notification');
      socket.off('conversation:created', handleNewConversation);
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
    if (!searchQuery) return true;
    const otherUser = conv.otherParticipant;
    if (!otherUser) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser.name?.toLowerCase().includes(searchLower) ||
      otherUser.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <Card className="w-full md:w-80 rounded-2xl md:rounded-[2.5rem] border-border bg-card flex flex-col shadow-sm overflow-hidden h-[50vh] md:h-auto">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-normal text-foreground">Inbox</h3>
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Skeleton className="h-10 w-full rounded-xl" />
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
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full md:w-80 rounded-2xl md:rounded-[2.5rem] border-border bg-card flex flex-col shadow-sm overflow-hidden h-[50vh] md:h-auto">
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-normal text-foreground">Inbox</h3>
        <div className="relative mt-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-10 h-10 bg-secondary/50 border-none rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
              const lastMessage = conversation.lastMessage;
              const isSelected = selectedConversationId === conversation.id;
              const unreadCount = conversation.unreadCount || 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-secondary/50 transition-colors",
                    isSelected && "bg-secondary"
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
                              {moment(lastMessage.createdAt).fromNow()}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

