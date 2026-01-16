"use client";

import React from 'react';
import { ArrowRight, Paperclip, Send, Loader2, Image, Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/utils";

export function ChatInput({
  value,
  onChange,
  onSend,
  onBlur,
  placeholder = "Type a message...",
  disabled = false,
  sending = false,
}) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 40,
    maxHeight: 90,
  });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !sending) {
        onSend(e);
        adjustHeight(true);
      }
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled && !sending) {
      onSend(e);
      adjustHeight(true);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-secondary/50 p-1.5 dark:bg-secondary/30">
        <div className="relative">
          <div className="relative flex flex-col">
            <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
              <Textarea
                className={cn(
                  "w-full resize-none rounded-xl rounded-b-none border-none bg-transparent px-4 py-3 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
                  "min-h-[60px] text-foreground"
                )}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                placeholder={placeholder}
                ref={textareaRef}
                value={value}
                disabled={disabled}
              />
            </div>

            <div className="flex h-14 items-center rounded-b-xl bg-transparent">
              <div className="absolute right-3 bottom-3 left-3 flex w-[calc(100%-24px)] items-center justify-between">
                <div className="flex items-center gap-1">
                  <label
                    aria-label="Attach file"
                    className={cn(
                      "cursor-pointer rounded-lg bg-transparent p-2",
                      "hover:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      "text-muted-foreground hover:text-foreground",
                      disabled && "cursor-not-allowed opacity-50"
                    )}>
                    <input className="hidden" type="file" disabled={disabled} />
                    <Paperclip className="h-4 w-4 transition-colors" />
                  </label>
                  <label
                    aria-label="Attach image"
                    className={cn(
                      "cursor-pointer rounded-lg bg-transparent p-2",
                      "hover:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      "text-muted-foreground hover:text-foreground",
                      disabled && "cursor-not-allowed opacity-50"
                    )}>
                    <input className="hidden" type="file" accept="image/*" disabled={disabled} />
                    <Image className="h-4 w-4 transition-colors" />
                  </label>
                  <button
                    aria-label="Add emoji"
                    className={cn(
                      "cursor-pointer rounded-lg bg-transparent p-2",
                      "hover:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      "text-muted-foreground hover:text-foreground",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                    disabled={disabled}
                  >
                    <Smile className="h-4 w-4 transition-colors" />
                  </button>
                </div>
                <button
                  aria-label="Send message"
                  onClick={handleSend}
                  disabled={!value.trim() || disabled || sending}
                  type="button"
                  className={cn(
                    "rounded-lg bg-primary p-2 text-primary-foreground",
                    "hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-opacity duration-200"
                  )}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

