"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Loader2, ArrowLeft, Phone, Video, Star, MoreVertical, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import moment from 'moment';
import useAuthStore from '@/store/useAuthStore';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import { UserStatus } from './UserStatus';
import { ChatInput } from './ChatInput';
import { ChatBubble } from './ChatBubble';
import { OrderCard } from './OrderCard';
import CreateContractModal from './CreateContractModal';  

export function ChatWindow({ conversation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [service, setService] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const isTypingRef = useRef(false);
  const { socket, isConnected } = useGlobalSocket();
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();

  useEffect(() => {
    if (!conversation) return;

    const otherUserId = conversation.otherParticipant?.id;
    const conversationId = conversation.id;

    // Only join conversation room if conversation exists
    if (socket && isConnected && conversationId) {
      socket.emit('join_conversation', conversationId);
      
      // Emit chat:focus when user opens chat
      if (otherUserId) {
        socket.emit('chat:focus', { partnerId: otherUserId });
      }
    } else if (socket && isConnected && otherUserId) {
      // If no conversation yet but we have otherUserId, just emit chat:focus
      socket.emit('chat:focus', { partnerId: otherUserId });
    }

    // Fetch messages only if conversation exists
    if (socket && isConnected && conversationId) {
      fetchMessages();
    } else {
      // No conversation yet, show empty state
      setMessages([]);
      setLoading(false);
    }

    // Fetch order for this conversation
    if (socket && isConnected && conversationId) {
      fetchOrder(conversationId);
    } else {
      setOrder(null);
    }

    return () => {
      if (socket && isConnected) {
        if (conversationId) {
          socket.emit('leave_conversation', conversationId);
        }
        // Emit chat:blur when user leaves chat
        socket.emit('chat:blur');
      }
    };
  }, [conversation?.id, conversation?.otherParticipant?.id, socket, isConnected]);

  // Fallback: Fetch order via REST API
  const fetchOrderViaAPI = useCallback(async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingOrder(false);
        return;
      }

      const response = await fetch(`/api/orders/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Order fetched via API:', data);
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setOrder(null);
        }
      } else {
        // No order found is OK (404)
        if (response.status === 404) {
          console.log('No order found for this conversation');
          setOrder(null);
        } else {
          console.error('API error fetching order:', response.status);
          setOrder(null);
        }
      }
    } catch (error) {
      console.error('Error fetching order via API:', error);
      setOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  }, []);

  // Fetch order by conversation ID
  const fetchOrder = useCallback(async (conversationId) => {
    if (!conversationId) {
      setOrder(null);
      return;
    }

    setLoadingOrder(true);
    let orderFetched = false;
    
    // Try Socket.IO first
    if (socket && isConnected) {
      try {
        socket.emit('get_order_by_conversation', { conversationId });

        const handleOrderFetched = (data) => {
          if (orderFetched) return; // Prevent duplicate calls
          orderFetched = true;
          console.log('Order fetched via Socket.IO:', data);
          if (data.order) {
            setOrder(data.order);
          } else {
            setOrder(null);
          }
          setLoadingOrder(false);
        };

        const handleError = (error) => {
          if (orderFetched) return;
          console.error('Socket error fetching order:', error);
          // Fallback to API
          fetchOrderViaAPI(conversationId);
        };

        socket.once('order:fetched', handleOrderFetched);
        socket.once('error', handleError);
        
        // Timeout after 3 seconds, fallback to API
        setTimeout(() => {
          if (!orderFetched) {
            console.log('Socket timeout, falling back to API');
            orderFetched = true;
            fetchOrderViaAPI(conversationId);
          }
        }, 3000);
      } catch (error) {
        console.error('Error in socket fetch:', error);
        if (!orderFetched) {
          fetchOrderViaAPI(conversationId);
        }
      }
    } else {
      // Socket not available, use API directly
      fetchOrderViaAPI(conversationId);
    }
  }, [socket, isConnected, fetchOrderViaAPI]);

  // Listen for order updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderUpdate = (data) => {
      if (data.order && data.order.conversationId === conversation?.id) {
        setOrder(data.order);
      }
    };

    socket.on('order:updated', handleOrderUpdate);

    return () => {
      socket.off('order:updated', handleOrderUpdate);
    };
  }, [socket, isConnected, conversation?.id]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    const handleNewMessage = (data) => {
      if (data.conversationId === conversation?.id) {
        setMessages((prev) => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some((msg) => msg.id === data.message.id);
          if (exists) return prev;
          
          // Replace optimistic message with real message if content matches
          const optimisticIndex = prev.findIndex(
            (msg) => msg.id?.startsWith('temp-') && msg.content === data.message.content && msg.senderId === data.message.senderId
          );
          
          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one
            const updated = [...prev];
            updated[optimisticIndex] = data.message;
            return updated;
          }
          
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.conversationId === conversation?.id && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            // Add or update typing user
            const filtered = prev.filter((u) => u.userId !== data.userId);
            return [...filtered, { userId: data.userId, userName: data.userName }];
          }
          // Remove typing user immediately when isTyping is false
          return prev.filter((u) => u.userId !== data.userId);
        });
      }
    };

    // Listen for message read receipts
    const handleMessageRead = (data) => {
      if (data.conversationId === conversation?.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    };

    // Listen for message sent confirmation
    const handleMessageSent = (data) => {
      if (data.conversationId === conversation?.id) {
        // Message already added optimistically, just update if needed
        setSending(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('message_read', handleMessageRead);
    socket.on('message:sent', handleMessageSent);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('message_read', handleMessageRead);
      socket.off('message:sent', handleMessageSent);
    };
  }, [socket, isConnected, conversation?.id, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchMessages = () => {
    if (!conversation || !socket || !isConnected) return;

    setLoading(true);
    
    // Request messages via Socket.IO
    socket.emit('fetch_messages', {
      conversationId: conversation.id,
      page: 1,
      limit: 50,
    });

    // Listen for response
    const handleMessagesFetched = (data) => {
      if (data.conversationId === conversation.id) {
        setMessages(data.messages || []);
        setLoading(false);
        scrollToBottom();
      }
    };

    socket.once('messages:fetched', handleMessagesFetched);

    // Cleanup listener if component unmounts
    return () => {
      socket.off('messages:fetched', handleMessagesFetched);
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageContent.trim() || !socket || !isConnected || sending) return;

    const content = messageContent.trim();
    const otherUserId = conversation?.otherParticipant?.id;

    // If no conversation exists yet, create it first
    if (!conversation?.id && otherUserId) {
      setSending(true);
      
      // Create conversation first
      socket.emit('create_conversation', { otherUserId });

      const handleConversationCreated = (data) => {
        if (data.conversation) {
          // Now send the message with the new conversation ID
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            content,
            senderId: user.id,
            conversationId: data.conversation.id,
            isRead: false,
            createdAt: new Date().toISOString(),
            sender: {
              id: user.id,
              name: user.name,
              email: user.email,
              profileImage: user.profileImage,
            },
            seenBy: [],
          };

          setMessages([optimisticMessage]);
          setMessageContent('');
          scrollToBottom();

          // Send message via Socket.IO
          socket.emit('send_message', {
            conversationId: data.conversation.id,
            content,
          });

          // Update conversation in parent component
          if (window.location.search.includes('otherUserId')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('otherUserId');
            url.searchParams.set('conversationId', data.conversation.id);
            window.history.replaceState({}, '', url);
          }

          setSending(false);
        } else {
          setSending(false);
          console.error('Failed to create conversation');
        }
      };

      const handleError = (error) => {
        setSending(false);
        console.error('Error creating conversation:', error);
      };

      socket.once('conversation:created', handleConversationCreated);
      socket.once('error', handleError);

      return;
    }

    // If conversation exists, send message normally
    if (!conversation?.id) {
      console.error('No conversation ID and no otherUserId');
      return;
    }

    // Create optimistic message for immediate display
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderId: user.id,
      conversationId: conversation.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
      seenBy: [],
    };

    // Add message immediately to UI
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageContent('');
    // setSending(true);
    scrollToBottom();

    // Stop typing indicator immediately
    stopTyping();

    try {
      // Send via Socket.IO
      socket.emit('send_message', {
        conversationId: conversation.id,
        content,
      });

      // The real message will replace the optimistic one via 'new_message' event
      setSending(false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setMessageContent(content); // Restore message content
      setSending(false);
    }
  };

  // Debounced typing indicator
  const startTyping = useCallback(() => {
    if (!socket || !isConnected || !conversation || !conversation.id) return;

    // Clear existing debounce
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    // If not already typing, emit typing start
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', {
        conversationId: conversation.id,
        isTyping: true,
      });
    }

    // Set debounce to stop typing after 1 second of inactivity
    typingDebounceRef.current = setTimeout(() => {
      stopTyping();
    }, 500);
  }, [socket, isConnected, conversation?.id]);

  const stopTyping = useCallback(() => {
    if (!socket || !isConnected || !conversation) return;

    // Clear debounce
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }

    // If currently typing, emit stop
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing', {
        conversationId: conversation.id,
        isTyping: false,
      });
    }
  }, [socket, isConnected, conversation?.id]);

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  if (!conversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-secondary/10 opacity-50 pattern-grid"></div>
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <p className="text-muted-foreground font-normal mt-2">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const otherUser = conversation.otherParticipant;
  const hasConversation = !!conversation.id;

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.profileImage} alt={otherUser?.name} />
            <AvatarFallback>
              {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{otherUser?.name || 'Unknown User'}</p>
              {otherUser?.id && <UserStatus userId={otherUser.id} size="sm" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Online</span>
              <span>•</span>
              <span>Local time: {moment().format('HH:mm')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* <Button variant="ghost" size="icon" className="h-9 w-9">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Video className="h-4 w-4" />
            </Button> */}
            {/* <Button variant="ghost" size="icon" className="h-9 w-9">
              <Star className="h-4 w-4" />
            </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {role === 'FREELANCER' && (
                  <DropdownMenuItem
                    onClick={() => setShowCreateContractModal(true)}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Contract
                  </DropdownMenuItem>
                )}
                {/* Add more menu items here if needed */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Create Contract Modal */}
      {role === 'FREELANCER' && otherUser && (
        <CreateContractModal
          isOpen={showCreateContractModal}
          onClose={() => setShowCreateContractModal(false)}
          service={null}
          conversationId={conversation?.id}
          clientId={otherUser?.id}
          existingOrder={order}
          onContractCreated={(newOrder) => {
            setOrder(newOrder);
            setShowCreateContractModal(false);
            // Refresh order to get full details
            if (conversation?.id) {
              fetchOrder(conversation.id);
            }
          }}
        />
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto overflow-x-hidden" ref={scrollAreaRef}>
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, index) => {
              const isOwn = index % 3 === 0; // Alternate between own and other messages
              return (
                <div
                  key={index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isOwn && <Skeleton className="h-8 w-8 rounded-full" />}
                    <div className="space-y-2">
                      <Skeleton className={`h-auto rounded-2xl p-3 ${isOwn ? 'w-48' : 'w-56'}`} />
                      <Skeleton className={`h-3 w-16 ${isOwn ? 'ml-auto' : ''}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : messages.length === 0 && hasConversation ? (
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <div className="text-center">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : messages.length === 0 && !hasConversation ? (
          <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
            <div className="text-center">
              <p className="text-muted-foreground">Start a new conversation by sending a message!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full min-w-0">
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id;
              const isOptimistic = message.id?.startsWith('temp-');
              
              // Check if this is the contract creation message (contains contract details)
              // Contract message can be from freelancer (when freelancer views) or from freelancer (when client views)
              const isContractMessage = (
                message.content?.includes('Contract Created') || 
                message.content?.includes('📋 Contract') ||
                message.content?.includes('Order Number')
              );
              
              // Show order card after contract message
              // For freelancer: show if message is contract message (they sent it)
              // For client: show if message is contract message from freelancer
              const isFreelancerContractMessage = role === 'FREELANCER' && isContractMessage && isOwnMessage;
              const isClientContractMessage = role === 'CLIENT' && isContractMessage && !isOwnMessage;
              const showOrderCardAfter = (isFreelancerContractMessage || isClientContractMessage) && order;
              
              return (
                <React.Fragment key={message.id}>
                  {/* Hide contract message text, show only OrderCard */}
                  {!isContractMessage && (
                    <ChatBubble
                      message={message}
                      isOwnMessage={isOwnMessage}
                      isOptimistic={isOptimistic}
                      showAvatar={true}
                      showName={!isOwnMessage}
                    />
                  )}
                  {/* Show Order Card instead of contract message text */}
                  {showOrderCardAfter && (
                    <div className="flex justify-center my-4">
                      <div className="w-full max-w-md">
                        <OrderCard
                          order={order}
                          conversationId={conversation.id}
                          onOrderUpdate={(updatedOrder) => {
                            console.log('Order updated:', updatedOrder);
                            setOrder(updatedOrder);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {/* Show order card at the end if order exists but no contract message found in messages */}
            {order && !messages.some((msg) => {
              const isContractMsg = msg.content?.includes('Contract Created') || 
                                   msg.content?.includes('📋 Contract') ||
                                   msg.content?.includes('Order Number');
              // Check if contract message exists for current user's role
              if (role === 'FREELANCER') {
                return isContractMsg && msg.senderId === user?.id;
              } else {
                return isContractMsg && msg.senderId !== user?.id;
              }
            }) && (
              <div className="flex justify-center my-4">
                <div className="w-full max-w-md">
                  <OrderCard
                    order={order}
                    conversationId={conversation.id}
                    onOrderUpdate={(updatedOrder) => {
                      console.log('Order updated:', updatedOrder);
                      setOrder(updatedOrder);
                    }}
                  />
                </div>
              </div>
            )}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-secondary text-secondary-foreground rounded-2xl p-3">
                  <p className="text-sm text-muted-foreground">
                    {typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-border min-w-0">
        <ChatInput
          value={messageContent}
          onChange={(value) => {
            setMessageContent(value);
            startTyping();
          }}
          onSend={handleSendMessage}
          onBlur={stopTyping}
          placeholder={hasConversation ? "Type a message..." : "Type your first message..."}
          disabled={sending || !isConnected || !otherUser?.id}
          sending={sending}
        />
        {/* <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send. Shift + Enter for new line.
        </p> */}
        {!isConnected && (
          <div className="flex items-center gap-2 mt-2 justify-center">
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-muted-foreground">
              {connectionError ? `Connection error: ${connectionError}` : 'Reconnecting...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
