"use client";

import React, { useRef, useState } from 'react';
import { ArrowRight, Paperclip, Send, Loader2, Image, Smile, Video, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/utils";

export function ChatInput({
  value,
  onChange,
  onSend,
  onBlur,
  onFileSelect,
  onFilesChange,
  placeholder = "Type a message...",
  disabled = false,
  sending = false,
}) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 40,
    maxHeight: 90,
  });
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || selectedFiles.length > 0) && !disabled && !sending) {
        handleSend(e);
      }
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if ((value.trim() || selectedFiles.length > 0) && !disabled && !sending) {
      // If there are files selected, send them first
      if (selectedFiles.length > 0 && onFilesChange) {
        onFilesChange([...selectedFiles]);
        setSelectedFiles([]);
      }
      // Then send text message if any
      if (value.trim()) {
        onSend(e);
      }
      adjustHeight(true);
    }
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      file,
      type,
      id: `${Date.now()}-${Math.random()}`,
      preview: type === 'image' ? URL.createObjectURL(file) : null,
    }));

    // Only add to preview, don't send yet
    setSelectedFiles(prev => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Revoke object URL to free memory
      const removed = prev.find(f => f.id === fileId);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  return (
    <div className="w-full">
      {/* File Preview Section */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2 bg-secondary/30 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="relative group"
              >
                {fileItem.type === 'image' && fileItem.preview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : fileItem.type === 'video' ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-secondary flex items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 truncate">
                      {fileItem.file.name}
                    </span>
                  </div>
                ) : (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-secondary flex flex-col items-center justify-center p-1">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {fileItem.file.name}
                    </span>
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <input
                    ref={fileInputRef}
                    id="file-input-chat"
                    className="hidden"
                    type="file"
                    multiple
                    disabled={disabled}
                    onChange={(e) => handleFileChange(e, 'file')}
                  />
                  <label
                    htmlFor="file-input-chat"
                    className={cn(
                      "cursor-pointer rounded-lg bg-transparent p-2",
                      "hover:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      "text-muted-foreground hover:text-foreground",
                      disabled && "cursor-not-allowed opacity-50 pointer-events-none"
                    )}>
                    <Paperclip className="h-4 w-4 transition-colors" />
                  </label>
                  
                  <input
                    ref={imageInputRef}
                    id="image-input-chat"
                    className="hidden"
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={disabled}
                    onChange={(e) => handleFileChange(e, 'image')}
                  />
                  <label
                    htmlFor="image-input-chat"
                    className={cn(
                      "cursor-pointer rounded-lg bg-transparent p-2",
                      "hover:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      "text-muted-foreground hover:text-foreground",
                      disabled && "cursor-not-allowed opacity-50 pointer-events-none"
                    )}>
                    <Image className="h-4 w-4 transition-colors" />
                  </label>
                  
                  <input
                    ref={videoInputRef}
                    id="video-input-chat"
                    className="hidden"
                    type="file"
                    multiple
                    accept="video/*"
                    disabled={disabled}
                    onChange={(e) => handleFileChange(e, 'video')}
                  />
                  <label
                    htmlFor="video-input-chat"
                    className={cn(
                      "cursor-pointer rounded-lg bg-transparent p-2",
                      "hover:bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                      "text-muted-foreground hover:text-foreground",
                      disabled && "cursor-not-allowed opacity-50 pointer-events-none"
                    )}>
                    <Video className="h-4 w-4 transition-colors" />
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
                    <Smile  className="h-4 w-4 transition-colors" />
                  </button>
                </div>
                <button
                  aria-label="Send message"
                  onClick={handleSend}
                  disabled={(!value.trim() && selectedFiles.length === 0) || disabled || sending}
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

