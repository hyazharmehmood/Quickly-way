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
import { OfferCard } from './OfferCard';
import CreateOfferModal from './CreateOfferModal';  
import { ImageGallery } from './ImageGallery';  

export function ChatWindow({ conversation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [service, setService] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const isTypingRef = useRef(false);
  const { socket, isConnected } = useGlobalSocket();
  const { user, isSeller } = useAuthStore();
  const role = user?.role?.toUpperCase();
  const isFreelancer = role === 'FREELANCER' || (role === 'CLIENT' && isSeller);

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

    // Orders are now fetched with messages, no separate call needed

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

  
  // Listen for order updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderUpdate = (data) => {
      console.log('📦 Order update received:', {
        orderId: data.order?.id,
        status: data.order?.status,
        conversationId: data.order?.conversationId,
        currentConversationId: conversation?.id,
        eventType: data.eventType,
      });

      if (data.order && data.order.conversationId === conversation?.id) {
        // Update order in messages
        setMessages((prev) => {
          const updated = prev.map((msg) => {
            if (msg.order && msg.order.id === data.order.id) {
              console.log('✅ Updating order in message:', {
                messageId: msg.id,
                oldStatus: msg.order.status,
                newStatus: data.order.status,
              });
              return { ...msg, order: data.order };
            }
            return msg;
          });
          return updated;
        });

        // Also update orders array
        setOrders((prev) => {
          const updated = prev.map((order) =>
            order.id === data.order.id ? data.order : order
          );
          return updated;
        });

        console.log('✅ Order updated in chat window');
    } else {
        console.log('⚠️ Order update ignored - conversation mismatch:', {
          orderConversationId: data.order?.conversationId,
          currentConversationId: conversation?.id,
        });
      }
    };

    socket.on('order:updated', handleOrderUpdate);

    return () => {
      socket.off('order:updated', handleOrderUpdate);
    };
  }, [socket, isConnected, conversation?.id]);

  // Listen for offer updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOfferUpdate = (data) => {
      console.log('💼 Offer update received:', {
        offerId: data.offer?.id,
        status: data.offer?.status,
        conversationId: data.offer?.conversationId,
        currentConversationId: conversation?.id,
        eventType: data.eventType,
      });

      if (data.offer && data.offer.conversationId === conversation?.id) {
        // Update offer in messages
        setMessages((prev) => {
          const updated = prev.map((msg) => {
            if (msg.offer && msg.offer.id === data.offer.id) {
              console.log('✅ Updating offer in message:', {
                messageId: msg.id,
                oldStatus: msg.offer.status,
                newStatus: data.offer.status,
              });
              return { ...msg, offer: data.offer };
            }
            return msg;
          });
          return updated;
        });

        console.log('✅ Offer updated in chat window');
      } else {
        console.log('⚠️ Offer update ignored - conversation mismatch:', {
          offerConversationId: data.offer?.conversationId,
          currentConversationId: conversation?.id,
        });
      }
    };

    socket.on('offer:updated', handleOfferUpdate);
    socket.on('offer:created', handleOfferUpdate);

    return () => {
      socket.off('offer:updated', handleOfferUpdate);
      socket.off('offer:created', handleOfferUpdate);
    };
  }, [socket, isConnected, conversation?.id]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    const handleNewMessage = async (data) => {
      if (data.conversationId === conversation?.id) {
        setMessages((prev) => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some((msg) => msg.id === data.message.id);
          if (exists) return prev;
          
          // Replace optimistic message with real message if content or attachment matches
          const optimisticIndex = prev.findIndex(
            (msg) => msg.id?.startsWith('temp-') && 
            msg.senderId === data.message.senderId &&
            (msg.content === data.message.content || 
             (msg.attachmentUrl && msg.attachmentUrl === data.message.attachmentUrl))
          );
          
          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one (remove isOptimistic flag)
            const updated = [...prev];
            updated[optimisticIndex] = { ...data.message, isOptimistic: false };
            return updated;
          }
          
          // Add message with order data if it's an offer message
          return [...prev, data.message];
        });

        // Order data should already be included from backend (like sender data)

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
        console.log('data.messages', data.messages);
        
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

  const handleFileSelect = async (file, type) => {
    // Legacy single file handler - kept for backward compatibility
    // This will be replaced by handleFilesChange
  };

  const handleFilesChange = async (fileItems) => {
    if (!socket || !isConnected || uploadingFile || fileItems.length === 0) return;
    
    setUploadingFile(true);
    try {
      const { uploadToCloudinary } = await import('@/utils/cloudinary');
      const otherUserId = conversation?.otherParticipant?.id;
      
      // Upload all files
      const uploadPromises = fileItems.map(async (fileItem) => {
        const resourceType = fileItem.type === 'video' ? 'video' : fileItem.type === 'image' ? 'image' : 'raw';
        const fileUrl = await uploadToCloudinary(fileItem.file, resourceType);
        return {
          ...fileItem,
          fileUrl,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Create optimistic messages for immediate display
      const optimisticMessages = uploadedFiles.map((fileItem, index) => ({
        id: `temp-${Date.now()}-${index}`,
        content: fileItem.file.name || '',
        type: fileItem.type,
        attachmentUrl: fileItem.fileUrl,
        attachmentName: fileItem.file.name,
        senderId: user.id,
        conversationId: conversation?.id || 'temp',
        isRead: false,
        isOptimistic: true,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
        },
        seenBy: [],
      }));

      // Add optimistic messages immediately
      if (conversation?.id) {
        setMessages((prev) => [...prev, ...optimisticMessages]);
        scrollToBottom();
      }

      // If no conversation exists yet, create it first
      if (!conversation?.id && otherUserId) {
        socket.emit('create_conversation', { otherUserId });
        
        const handleConversationCreated = (data) => {
          if (data.conversation) {
            // Update optimistic messages with real conversation ID
            setMessages((prev) => prev.map(msg => {
              const optimisticMsg = optimisticMessages.find(om => om.id === msg.id);
              return optimisticMsg 
                ? { ...msg, conversationId: data.conversation.id }
                : msg;
            }));
            
            // Send all messages with attachments
            uploadedFiles.forEach((fileItem) => {
              socket.emit('send_message', {
                conversationId: data.conversation.id,
                content: fileItem.file.name || '',
                type: fileItem.type,
                attachmentUrl: fileItem.fileUrl,
                attachmentName: fileItem.file.name,
              });
            });
          }
          socket.off('conversation:created', handleConversationCreated);
          socket.off('error', handleError);
        };
        
        const handleError = (error) => {
          console.error('Error creating conversation:', error);
          // Remove optimistic messages on error
          setMessages((prev) => prev.filter(msg => 
            !optimisticMessages.some(om => om.id === msg.id)
          ));
          socket.off('conversation:created', handleConversationCreated);
          socket.off('error', handleError);
        };
        
        socket.once('conversation:created', handleConversationCreated);
        socket.once('error', handleError);
      } else if (conversation?.id) {
        // Send all messages with attachments
        uploadedFiles.forEach((fileItem) => {
          socket.emit('send_message', {
            conversationId: conversation.id,
            content: fileItem.file.name || '',
            type: fileItem.type,
            attachmentUrl: fileItem.fileUrl,
            attachmentName: fileItem.file.name,
          });
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
      // Remove optimistic messages on error
      if (conversation?.id) {
        setMessages((prev) => prev.filter(msg => !msg.id?.startsWith('temp-')));
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!messageContent.trim() && !e.fileData) || !socket || !isConnected || sending) return;

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
            type: 'text',
            content,
            senderId: user.id,
            conversationId: data.conversation.id,
            isRead: false,
            isOptimistic: true,
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

    // Create optimistic message for immediate display (WhatsApp-style: show text right away)
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      type: 'text',
      content,
      senderId: user.id,
      conversationId: conversation.id,
      isRead: false,
      isOptimistic: true,
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
                {isFreelancer && (
                  <DropdownMenuItem
                    onClick={() => setShowCreateOfferModal(true)}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Send Offer
                  </DropdownMenuItem>
                )}
                {/* Add more menu items here if needed */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Create Offer Modal */}
      {isFreelancer && otherUser && (
        <CreateOfferModal
          isOpen={showCreateOfferModal}
          onClose={() => setShowCreateOfferModal(false)}
          service={null}
          conversationId={conversation?.id}
          clientId={otherUser?.id}
          existingOrder={orders[0] || null}
          onOfferCreated={(newOffer) => {
            // Offers will be updated when messages are fetched/refreshed
            setShowCreateOfferModal(false);
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
            {(() => {
              console.log("messages", messages);
              // Group conse
              // cutive image messages from the same sender
              const groupedMessages = [];
              let currentGroup = null;
              
              messages.forEach((message, index) => {
                const isOwnMessage = message.senderId === user?.id;
                const isImageMessage = message.type === 'image' && message.attachmentUrl;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                
                // Check if previous message in current group is also an image from same sender
                const isConsecutiveImage = 
                  isImageMessage && 
                  currentGroup &&
                  currentGroup.type === 'image-group' &&
                  currentGroup.isOwnMessage === isOwnMessage &&
                  currentGroup.messages.length > 0;
                
                if (isConsecutiveImage) {
                  // Add to current group
                  currentGroup.messages.push(message);
                } else {
                  // Start new group
                  if (currentGroup) {
                    groupedMessages.push(currentGroup);
                  }
                  currentGroup = {
                    type: isImageMessage ? 'image-group' : 'single',
                    messages: [message],
                    isOwnMessage,
                  };
                }
              });
              
              // Add last group
              if (currentGroup) {
                groupedMessages.push(currentGroup);
              }
              
              return groupedMessages.map((group, groupIndex) => {
                const firstMessage = group.messages[0];
                const isOwnMessage = firstMessage.senderId === user?.id;
                const isOptimistic = firstMessage.id?.startsWith('temp-');
                
                // Check if this is an offer message
                const isOfferMessage = firstMessage.type === 'offer';
                
                // Show offer card for offer messages (offer might be loading)
                const showOfferCard = isOfferMessage && firstMessage.attachmentName;
                
                // Show order card if offer was accepted and has order
                const showOrderCard = isOfferMessage && firstMessage.offer?.status === 'ACCEPTED' && firstMessage.offer?.order;
                
                return (
                  <React.Fragment key={`group-${groupIndex}-${firstMessage.id}`}>
                    {/* Hide offer message text, only show OfferCard */}
                    {!isOfferMessage && (
                      <>
                        {group.type === 'image-group' && group.messages.length > 1 ? (
                          // Render image gallery for multiple consecutive images
                          <div className={isOwnMessage ? "flex justify-end" : "flex justify-start"}>
                            <div className={isOwnMessage ? "flex items-end gap-2 max-w-[70%]" : "flex items-end gap-2 max-w-[70%]"}>
                              {!isOwnMessage && (
                                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                                  <AvatarImage src={firstMessage.sender?.profileImage} alt={firstMessage.sender?.name} />
                                  <AvatarFallback>
                                    {firstMessage.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex flex-col gap-1">
                                {!isOwnMessage && (
                                  <p className="text-xs font-medium text-muted-foreground px-1">
                                    {firstMessage.sender?.name || 'Unknown'}
                                  </p>
                                )}
                                <div className={`
                                  ${isOwnMessage ? 'bg-primary text-primary-foreground rounded-r-lg rounded-tl-lg' : 'bg-secondary text-secondary-foreground rounded-l-lg rounded-tr-lg'}
                                  ${isOptimistic ? 'opacity-70' : ''}
                                  p-0 overflow-hidden
                                `}>
                                  <ImageGallery images={group.messages} isOwnMessage={isOwnMessage} />
                                </div>
                                <div className={isOwnMessage ? "flex justify-end px-1" : "flex justify-start px-1"}>
                                  <p className={`text-xs text-muted-foreground ${isOptimistic ? 'opacity-70' : ''}`}>
                                    {moment(firstMessage.createdAt).format('HH:mm A')}
                                  </p>
                                </div>
                              </div>
                              {isOwnMessage && (
                                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                                  <AvatarImage src={firstMessage.sender?.profileImage} alt={firstMessage.sender?.name} />
                                  <AvatarFallback>
                                    {firstMessage.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Render single message or single image
                          <ChatBubble
                            message={firstMessage}
                            isOwnMessage={isOwnMessage}
                            isOptimistic={firstMessage.isOptimistic || isOptimistic}
                            showAvatar={true}
                            showName={!isOwnMessage}
                          />
                        )}
                      </>
                    )}
                    {/* Show Offer Card for offer messages */}
                    {showOfferCard && firstMessage.offer && (
                      <div className="flex justify-center my-4">
                        <div className="w-full max-w-md space-y-4">
                          <OfferCard
                            offer={firstMessage.offer}
                            conversationId={conversation.id}
                            onOfferUpdate={(updatedOffer) => {
                              console.log('Offer updated:', updatedOffer);
                              // Update offer in messages
                              setMessages((prev) =>
                                prev.map((msg) =>
                                  msg.id === firstMessage.id
                                    ? { ...msg, offer: updatedOffer }
                                    : msg
                                )
                              );
                            }}
                          />
                         
                        </div>
                      </div>
                    )}
                    {/* Show loading state for offer messages without offer data */}
                    {showOfferCard && !firstMessage.offer && (
              <div className="flex justify-center my-4">
                <div className="w-full max-w-md">
                          <Card className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <p className="text-sm text-muted-foreground">Loading offer...</p>
                            </div>
                          </Card>
                </div>
              </div>
            )}
                  </React.Fragment>
                );
              });
            })()}
            {/* Orders are now displayed inline with their offer messages above */}
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
            // startTyping();
          }}
          onSend={handleSendMessage}
          // onBlur={stopTyping}
          onFileSelect={handleFileSelect}
          onFilesChange={handleFilesChange}
          placeholder={hasConversation ? "Type a message..." : "Type your first message..."}
          disabled={sending || uploadingFile || !isConnected || !otherUser?.id}
          sending={sending || uploadingFile}
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
