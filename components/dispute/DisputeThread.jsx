"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Image as ImageIcon, File, AlertCircle, User, Shield, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/utils';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import useAuthStore from '@/store/useAuthStore';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import { uploadToCloudinary } from '@/utils/cloudinary';

const ROLE_CONFIG = {
  CLIENT: { label: 'Client' },
  FREELANCER: { label: 'Service Provider' },
  ADMIN: { label: 'Admin' },
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i;
const isImageAttachment = (att) =>
  att.type === 'image' || (att.name && IMAGE_EXT.test(att.name)) || (att.url && /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i.test(att.url));
const isVideoAttachment = (att) =>
  att.type === 'video' || (att.name && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(att.name));

export default function DisputeThread({ dispute, order, onCommentAdded }) {
  const { user } = useAuthStore();
  const { socket } = useGlobalSocket();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (dispute?.id) {
      fetchComments();
    }
  }, [dispute?.id]);

  // Real-time: subscribe to dispute room when viewing
  useEffect(() => {
    if (!socket || !dispute?.id) return;
    socket.emit('dispute:subscribe', { disputeId: dispute.id });
    return () => {
      socket.emit('dispute:unsubscribe', { disputeId: dispute.id });
    };
  }, [socket, dispute?.id]);

  // Real-time: listen for new comments from other users (or self from another tab)
  useEffect(() => {
    if (!socket || !dispute?.id) return;
    const handleNewComment = (data) => {
      if (data?.disputeId !== dispute.id || !data?.comment) return;
      const comment = data.comment;
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    };
    socket.on('dispute:new_comment', handleNewComment);
    return () => socket.off('dispute:new_comment', handleNewComment);
  }, [socket, dispute?.id]);

  useEffect(() => {
    // Auto-scroll to bottom when new comments arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const fetchComments = async () => {
    try {
   
      const response = await api.get(`/disputes/${dispute.id}/comments`);
      if (response.data.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = async (files) => {
    if (files.length === 0) {
      setAttachments([]);
      return;
    }

    // Limit to 5 files
    if (files.length > 5) {
      toast.error('Maximum 5 attachments allowed');
      return;
    }

    // Check file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(fileItem => fileItem.file && fileItem.file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 10MB limit`);
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (fileItem) => {
        const file = fileItem.file;
        const url = await uploadToCloudinary(file);
        return {
          url,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
          size: file.size,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(uploadedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
      setAttachments([]);
    } finally {
      setUploading(false);
    }
  };

  const handleSendComment = async (e, filesToUpload = null) => {
    e?.preventDefault();

    // If files are passed from ChatInput, upload them first
    let finalAttachments = [...attachments];
    
    if (filesToUpload && filesToUpload.length > 0) {
      // Upload new files from ChatInput
      setUploading(true);
      try {
        // Limit to 5 files total
        const totalFiles = finalAttachments.length + filesToUpload.length;
        if (totalFiles > 5) {
          toast.error('Maximum 5 attachments allowed');
          setUploading(false);
          return;
        }

        // Check file sizes (max 10MB each)
        const maxSize = 10 * 1024 * 1024; // 10MB
        const oversizedFiles = filesToUpload.filter(fileItem => fileItem.file && fileItem.file.size > maxSize);
        if (oversizedFiles.length > 0) {
          toast.error(`Some files exceed 10MB limit`);
          setUploading(false);
          return;
        }

        const uploadPromises = filesToUpload.map(async (fileItem) => {
          const file = fileItem.file;
          const url = await uploadToCloudinary(file);
          return {
            url,
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
            size: file.size,
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);
        finalAttachments = [...finalAttachments, ...uploadedFiles];
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload files');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    } else {
      // Wait for any ongoing uploads to complete
      if (uploading) {
        while (uploading) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Re-fetch attachments after upload completes
        finalAttachments = [...attachments];
      }
    }

    if (!commentContent.trim() && finalAttachments.length === 0) {
      toast.error('Please enter a comment or attach a file');
      return;
    }

    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      toast.error('Cannot add comments to a resolved dispute');
      return;
    }

    try {
      setSending(true);
      // Remove emojis from comment content before sending
      const cleanedContent = removeEmojis(commentContent.trim()) || '(No text)';
      const response = await api.post(`/disputes/${dispute.id}/comments`, {
        content: cleanedContent,
        attachments: finalAttachments.length > 0 ? finalAttachments : null,
      });

      if (response.data.success) {
        setCommentContent('');
        setAttachments([]);
        setSelectedFiles([]);
        await fetchComments();
        if (onCommentAdded) {
          onCommentAdded();
        }
        toast.success('Comment added');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      toast.error(error.response?.data?.error || 'Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  const canComment = dispute.status === 'OPEN' || dispute.status === 'IN_REVIEW';
  const isClient = user?.id === order?.clientId;
  const isFreelancer = user?.id === order?.freelancerId;
  const isAdmin = user?.role === 'ADMIN';
  const canAddComment = canComment && (isClient || isFreelancer || isAdmin);

  const removeEmojis = (text) => {
    if (!text) return text;
    // Remove emojis using regex pattern
    // This pattern matches most emoji ranges including:
    // - Emoticons (😀-🙏)
    // - Symbols & Pictographs (🌀-🗿)
    // - Transport & Map Symbols (🚀-🛿)
    // - Flags (🏁-🏿)
    // - And other emoji ranges
    return text.replace(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]/gu,
      ''
    ).trim();
  };

  const getFileIcon = (type) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4" />;
    if (type === 'file' && type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <Card className="rounded-4xl border-none">
      <CardHeader>
        <CardTitle className="text-lg font-normal flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          Dispute Thread
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {/* Initial Dispute Info */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="destructive" className="text-xs">
                  {dispute.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Filed {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Reason: {dispute.reason}</p>
              <p className="text-sm text-muted-foreground">{dispute.description}</p>
              {dispute.initialAttachments && Array.isArray(dispute.initialAttachments) && dispute.initialAttachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {dispute.initialAttachments.map((att, idx) => (
                    <div key={idx}>
                      {isImageAttachment(att) ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border border-red-200 max-w-[220px] max-h-48 focus:ring-2 focus:ring-primary focus:ring-offset-1"
                        >
                          <img
                            src={att.url}
                            alt={att.name || 'Image'}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            loading="lazy"
                          />
                          {att.name && (
                            <p className="text-xs truncate px-1.5 py-1 bg-black/5">{att.name}</p>
                          )}
                        </a>
                      ) : isVideoAttachment(att) ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-white border border-red-200 text-xs hover:bg-red-50"
                        >
                          <Paperclip className="h-4 w-4 shrink-0" />
                          <span className="underline truncate max-w-[140px]">{att.name || 'Video'}</span>
                          <span className="opacity-80">Open</span>
                        </a>
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-white border border-red-200 text-xs hover:bg-red-50"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="underline truncate max-w-[140px]">{att.name || 'Document'}</span>
                          <span className="opacity-80">Open</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Comments — ticket-style chat bubbles */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No comments yet</div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const isOwnMessage = comment.userId === user?.id;
                  const roleLabel = (ROLE_CONFIG[comment.role] || ROLE_CONFIG.CLIENT).label;

                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        'flex w-full gap-2',
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 shrink-0 mt-1">
                          <AvatarImage src={comment.user?.profileImage} alt={comment.user?.name} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {(comment.user?.name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'flex flex-col gap-1 max-w-[70%] min-w-0',
                          isOwnMessage ? 'items-end' : 'items-start'
                        )}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-medium text-muted-foreground px-1">
                            {comment.user?.name || 'Unknown'} · {roleLabel}
                          </p>
                        )}
                        <div
                          className={cn(
                            'shadow-sm overflow-hidden px-4 py-2.5',
                            isOwnMessage
                              ? 'bg-primary rounded-r-lg rounded-tl-lg text-primary-foreground'
                              : 'bg-secondary rounded-l-lg rounded-tr-lg text-secondary-foreground'
                          )}
                        >
                          {comment.content && removeEmojis(comment.content).trim() && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {removeEmojis(comment.content)}
                            </p>
                          )}
                          {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                            <div className={cn('flex flex-col gap-2', comment.content?.trim() && 'mt-2')}>
                              {comment.attachments.map((att, idx) => (
                                <div key={idx}>
                                  {isImageAttachment(att) ? (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-lg overflow-hidden border border-black/10 max-w-[220px] max-h-48 focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                    >
                                      <img
                                        src={att.url}
                                        alt={att.name || 'Image'}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                        loading="lazy"
                                      />
                                      {att.name && (
                                        <p className="text-xs truncate px-1.5 py-1 bg-black/5">{att.name}</p>
                                      )}
                                    </a>
                                  ) : isVideoAttachment(att) ? (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/15 transition-colors"
                                    >
                                      <Paperclip className="h-4 w-4 shrink-0" />
                                      <span className="text-sm underline truncate flex-1">{att.name || 'Video'}</span>
                                      <span className="text-xs opacity-80">Open</span>
                                    </a>
                                  ) : (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/15 transition-colors"
                                    >
                                      <FileText className="h-4 w-4 shrink-0" />
                                      <span className="text-sm underline truncate flex-1">{att.name || 'Document'}</span>
                                      <span className="text-xs opacity-80">Open</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1 px-1',
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      {isOwnMessage && (
                        <Avatar className="h-8 w-8 shrink-0 mt-1">
                          <AvatarImage src={user?.profileImage} alt={user?.name} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {(user?.name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Comment Input */}
        {canAddComment && (
          <div className="p-6 border-t border-border">
            <ChatInput
              value={commentContent}
              onChange={(value) => {
                // Remove emojis in real-time as user types
                const cleanedValue = removeEmojis(value);
                setCommentContent(cleanedValue);
              }}
              onSend={(e, files) => {
                // ChatInput passes files when sending
                // Upload files and send comment together
                handleSendComment(e, files);
              }}
              onFilesChange={(files) => {
                // This is called when files are selected for preview
                // We don't upload yet, just store for preview
                if (files && files.length > 0) {
                  setSelectedFiles(files);
                } else {
                  setSelectedFiles([]);
                }
              }}
              placeholder="Add a comment to the dispute thread..."
              disabled={sending || uploading || !canComment}
              sending={sending || uploading}
            />
            {(attachments.length > 0 || selectedFiles.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {/* Show already uploaded attachments */}
                {attachments.map((att, idx) => (
                  <div
                    key={`att-${idx}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs"
                  >
                    {getFileIcon(att.type)}
                    <span className="max-w-[150px] truncate">{att.name}</span>
                    <button
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-destructive hover:text-destructive/80"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
               
              </div>
            )}
            {!canComment && (
              <p className="text-xs text-muted-foreground mt-2">
                This dispute is {dispute.status.toLowerCase()}. Comments are no longer allowed.
              </p>
            )}
          </div>
        )}
        {!canAddComment && (
          <div className="p-6 border-t border-border text-center text-muted-foreground text-sm">
            {dispute.status === 'RESOLVED' || dispute.status === 'CLOSED'
              ? 'This dispute is resolved. Comments are no longer allowed.'
              : 'You do not have permission to comment on this dispute.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

