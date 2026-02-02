"use client";

import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Paperclip, X, ChevronLeft, ChevronRight, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/utils";
import moment from 'moment';

export function ChatBubble({
  message,
  isOwnMessage,
  isOptimistic,
  showAvatar = true,
  showName = true,
  onResend,
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
            "shadow-sm overflow-hidden relative",
            isOwnMessage
              ? "bg-primary rounded-r-lg rounded-tl-lg text-primary-foreground"
              : "bg-secondary rounded-l-lg rounded-tr-lg text-secondary-foreground",
            isOptimisticMessage && "opacity-70",
            // Remove padding for images/videos, add for text
            (message.type === 'image' || message.type === 'video') ? "p-0" : "px-4 py-2.5"
          )}
        >
          {/* Image Attachment - WhatsApp Style with Progress Bar */}
          {message.type === 'image' && message.attachmentUrl && (
            <div className="relative group">
              <img
                src={message.attachmentUrl}
                alt={message.content || 'Image'}
                className={cn(
                  "w-full h-auto object-cover",
                  message.uploadProgress !== undefined && message.uploadProgress < 100 && "opacity-70",
                  message.uploadProgress === 100 && "cursor-pointer"
                )}
                loading="lazy"
                onClick={() => {
                  if (message.uploadProgress === 100 || message.uploadProgress === undefined) {
                    window.open(message.attachmentUrl, '_blank');
                  }
                }}
              />
              {/* Upload Progress Bar - WhatsApp Style */}
              {message.uploadProgress !== undefined && message.uploadProgress < 100 && !message.sendError && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
                  <div className="w-[80%] bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-white h-full transition-all duration-300 ease-out"
                      style={{ width: `${message.uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white mt-1">{message.uploadProgress}%</p>
                </div>
              )}
              {/* Error overlay for failed uploads */}
              {isOwnMessage && message.sendError && onResend && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <p className="text-xs text-white text-center px-2">
                    {message.uploadError || 'Upload failed'}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-3 text-xs mt-1"
                    onClick={() => onResend(message.id)}
                    disabled={message.resending}
                  >
                    {message.resending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
              {/* Text overlay on image if content exists */}
              {message.content && message.content.trim() && message.uploadProgress === 100 && !message.sendError && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Video Attachment - WhatsApp Style with Progress Bar */}
          {message.type === 'video' && message.attachmentUrl && (
            <div className="relative group">
              <video
                src={message.attachmentUrl}
                controls
                className={cn(
                  "w-full h-auto",
                  message.uploadProgress !== undefined && message.uploadProgress < 100 && "opacity-70"
                )}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              {/* Upload Progress Bar - WhatsApp Style */}
              {message.uploadProgress !== undefined && message.uploadProgress < 100 && !message.sendError && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
                  <div className="w-[80%] bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-white h-full transition-all duration-300 ease-out"
                      style={{ width: `${message.uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white mt-1">{message.uploadProgress}%</p>
                </div>
              )}
              {/* Error overlay for failed uploads */}
              {isOwnMessage && message.sendError && onResend && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <p className="text-xs text-white text-center px-2">
                    {message.uploadError || 'Upload failed'}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-3 text-xs mt-1"
                    onClick={() => onResend(message.id)}
                    disabled={message.resending}
                  >
                    {message.resending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry Upload
                      </>
                    )}
                  </Button>
                </div>
              )}
              {/* Text overlay on video if content exists */}
              {message.content && message.content.trim() && message.uploadProgress === 100 && !message.sendError && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* File Attachment - WhatsApp Style with Progress Bar */}
          {message.type === 'file' && message.attachmentUrl && (
            <div className="relative mb-2 flex items-center gap-2 p-3 bg-black/10 rounded-lg">
              <Paperclip className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "text-sm underline truncate block",
                    message.uploadProgress !== undefined && message.uploadProgress < 100 && "opacity-70 pointer-events-none"
                  )}
                >
                  {message.attachmentName || 'Download file'}
                </a>
                {/* Upload Progress Bar - WhatsApp Style */}
                {message.uploadProgress !== undefined && message.uploadProgress < 100 && !message.sendError && (
                  <div className="mt-2">
                    <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${message.uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{message.uploadProgress}%</p>
                  </div>
                )}
                {/* Error state for failed file uploads */}
                {isOwnMessage && message.sendError && onResend && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive flex-1">
                      {message.uploadError || 'Upload failed'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onResend(message.id)}
                      disabled={message.resending}
                    >
                      {message.resending ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
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
          
          {/* Error state with resend button (WhatsApp style) - for text messages only */}
          {isOwnMessage && message.sendError && onResend && message.type === 'text' && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-destructive" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onResend(message.id)}
                disabled={message.resending}
              >
                {message.resending ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Resend
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Loading state */}
          {isOwnMessage && message.isOptimistic && !message.sendError && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          
          {/* WhatsApp-style ticks for own messages */}
          {isOwnMessage && !isOptimisticMessage && !message.sendError && (
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
          )}
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

