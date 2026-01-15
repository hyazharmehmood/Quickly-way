"use client";

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/utils";
import moment from 'moment';

export function ChatBubble({
  message,
  isOwnMessage,
  isOptimistic = false,
  showAvatar = true,
  showName = true,
}) {
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
            " px-4 py-2.5 shadow-sm",
            "overflow-hidden",
            isOwnMessage
              ? "bg-primary rounded-r-lg rounded-tl-lg text-primary-foreground"
              : "bg-secondary rounded-l-lg rounded-tr-lg text-secondary-foreground",
            isOptimistic && "opacity-70"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words break-all overflow-wrap-anywhere word-break-break-all hyphens-auto">
            {message.content}
          </p>
        </div>
        
        <p className={cn(
          "text-xs text-muted-foreground px-1 text-right",
          isOptimistic && "opacity-70"
        )}>
          {moment(message.createdAt).format('HH:mm A')}
          {isOptimistic && ' (sending...)'}
        </p>
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

