"use client";

import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";
import moment from 'moment';

export function ChatBubble({
  message,
  isOwnMessage,
  isOptimistic,
  showAvatar = true,
  showName = true,
}) {
  // Check if message is optimistic (either from prop or message property)
  const isOptimisticMessage = isOptimistic !== undefined ? isOptimistic : message.isOptimistic;
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {!isOwnMessage && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={message.sender?.profileImage} alt={message.sender?.name} />
          <AvatarFallback>
            {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[70%] min-w-0",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {!isOwnMessage && showName && (
          <p className="text-xs font-medium text-muted-foreground px-1">
            {message.sender?.name || 'Unknown'}
          </p>
        )}
        
        <div
          className={cn(
            "shadow-sm overflow-hidden",
            isOwnMessage
              ? "bg-primary rounded-r-lg rounded-tl-lg text-primary-foreground"
              : "bg-secondary rounded-l-lg rounded-tr-lg text-secondary-foreground",
            isOptimisticMessage && "opacity-70",
            // Remove padding for images/videos, add for text
            (message.type === 'image' || message.type === 'video') ? "p-0" : "px-4 py-2.5"
          )}
        >
          {/* Image Attachment - WhatsApp Style */}
          {message.type === 'image' && message.attachmentUrl && (
            <div className="relative group">
              <img
                src={message.attachmentUrl}
                alt={message.content || 'Image'}
                className="w-full h-auto object-cover cursor-pointer"
                loading="lazy"
                onClick={() => {
                  // Open image in full screen (can be enhanced with a modal)
                  window.open(message.attachmentUrl, '_blank');
                }}
              />
              {/* Text overlay on image if content exists */}
              {message.content && message.content.trim() && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Video Attachment */}
          {message.type === 'video' && message.attachmentUrl && (
            <div className="relative">
              <video
                src={message.attachmentUrl}
                controls
                className="w-full h-auto"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              {/* Text overlay on video if content exists */}
              {message.content && message.content.trim() && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* File Attachment */}
          {message.type === 'file' && message.attachmentUrl && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-black/10 rounded-lg">
              <Paperclip className="h-4 w-4" />
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline truncate flex-1"
              >
                {message.attachmentName || 'Download file'}
              </a>
            </div>
          )}
          
          {/* Text Content (only if not image/video or if image/video has no content) */}
          {message.type === 'text' && message.content && (
            <p className="text-sm whitespace-pre-wrap break-words break-all overflow-wrap-anywhere word-break-break-all hyphens-auto">
              {message.content}
            </p>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-1 px-1",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          <p className={cn(
            "text-xs text-muted-foreground",
            isOptimisticMessage && "opacity-70"
          )}>
            {moment(message.createdAt).format('HH:mm A')}
          </p>
          {/* WhatsApp-style ticks for own messages */}
          {/* {isOwnMessage && !isOptimistic && (
            <span className={cn(
              "text-xs inline-flex items-center",
              message.seenAt 
                ? "text-blue-500" // Double blue tick (seen)
                : message.deliveredAt 
                  ? "text-muted-foreground" // Double tick (delivered)
                  : "text-muted-foreground/50" // Single tick (sent)
            )}>
              {message.seenAt || message.deliveredAt ? '✓✓' : '✓'}
            </span>
          )} */}
        </div>
      </div>
      
      {isOwnMessage && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={message.sender?.profileImage} alt={message.sender?.name} />
          <AvatarFallback>
            {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

