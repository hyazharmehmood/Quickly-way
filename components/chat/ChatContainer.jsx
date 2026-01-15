"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
// Removed API import - using Socket.IO only

export function ChatContainer() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationIdFromUrl = searchParams?.get('conversationId');
  const otherUserIdFromUrl = searchParams?.get('otherUserId'); // For new conversations
  const { socket, isConnected } = useGlobalSocket();
  const isLoadingFromUrlRef = useRef(false);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowChatWindow(true);
    // Clear URL parameter when manually selecting
    if (typeof window !== 'undefined' && conversationIdFromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete('conversationId');
      router.replace(url.pathname + url.search);
    }
  };

  const handleBack = () => {
    setShowChatWindow(false);
    // Clear URL parameter when going back
    if (typeof window !== 'undefined' && conversationIdFromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete('conversationId');
      router.replace(url.pathname + url.search);
    }
  };

  // Load conversation from URL if provided (via Socket.IO)
  // This happens when user clicks "Contact Me" button
  useEffect(() => {
    // If socket not connected, wait
    if (!socket || !isConnected) {
      return;
    }

    // If we have conversationId, load that conversation
    if (conversationIdFromUrl) {
      // If conversation is already selected and matches URL, just open window
      if (selectedConversation?.id === conversationIdFromUrl) {
        setShowChatWindow(true);
        isLoadingFromUrlRef.current = false;
        return;
      }

      // Prevent multiple loads
      if (isLoadingFromUrlRef.current) {
        return;
      }

      isLoadingFromUrlRef.current = true;
      setIsLoadingConversation(true);

      // Request conversation via Socket.IO
      socket.emit('get_conversation', { conversationId: conversationIdFromUrl });

      const handleConversationFetched = (data) => {
        isLoadingFromUrlRef.current = false;
        setIsLoadingConversation(false);
        if (data.conversation) {
          setSelectedConversation(data.conversation);
          setShowChatWindow(true); // Auto-open chat window when coming from "Contact Me"
        }
      };

      const handleError = (error) => {
        isLoadingFromUrlRef.current = false;
        setIsLoadingConversation(false);
        console.error('Error loading conversation:', error);
        // If conversation not found but we have otherUserId, create empty conversation state
        if (otherUserIdFromUrl) {
          setSelectedConversation({
            id: null, // No conversation ID yet
            otherParticipant: { id: otherUserIdFromUrl },
          });
          setShowChatWindow(true);
        } else {
          setShowChatWindow(false);
        }
      };

      socket.once('conversation:fetched', handleConversationFetched);
      socket.once('error', handleError);

      return () => {
        socket.off('conversation:fetched', handleConversationFetched);
        socket.off('error', handleError);
      };
    } 
    // If we have otherUserId but no conversationId, create empty conversation state
    else if (otherUserIdFromUrl) {
      setIsLoadingConversation(true);
      // Fetch user info for otherUserId
      fetch(`/api/users/${otherUserIdFromUrl}`)
        .then(res => res.json())
        .then(userData => {
          setIsLoadingConversation(false);
          setSelectedConversation({
            id: null, // No conversation ID yet
            otherParticipant: userData || { id: otherUserIdFromUrl },
          });
          setShowChatWindow(true);
        })
        .catch(err => {
          console.error('Error fetching user:', err);
          setIsLoadingConversation(false);
          // Still set conversation with just ID
          setSelectedConversation({
            id: null,
            otherParticipant: { id: otherUserIdFromUrl },
          });
          setShowChatWindow(true);
        });
    }
  }, [conversationIdFromUrl, otherUserIdFromUrl, socket, isConnected, selectedConversation?.id]);

  return (
    <div className=" animate-in fade-in duration-500 flex flex-col md:flex-row gap-3 md:gap-4 ">
      <div className={`${showChatWindow ? 'hidden md:block' : 'block'} w-full md:w-80 flex-shrink-0`}>
        <ChatList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation?.id}
        />
      </div>
      <div className={`${showChatWindow ? 'block' : 'hidden md:flex'} flex-1 min-w-0 overflow-hidden`}>
        {isLoadingConversation ? (
          <Card className="flex-1 rounded-2xl md:rounded-[2.5rem] border-border bg-card flex flex-col shadow-sm overflow-hidden h-[calc(100vh-9.5rem)] max-w-full min-w-0">
            {/* Header Skeleton */}
            <div className="p-4 md:p-6 border-b border-border flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            {/* Messages Skeleton */}
            <div className="flex-1 p-4 space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-auto rounded-2xl p-3 w-48" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
            {/* Input Skeleton */}
            <div className="p-4 md:p-6 border-t border-border">
              <div className="flex gap-2">
                <Skeleton className="h-[60px] flex-1 rounded-md" />
                <Skeleton className="h-[60px] w-[60px] rounded-md" />
              </div>
            </div>
          </Card>
        ) : (
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
