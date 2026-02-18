'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Paperclip, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/utils';
import api from '@/utils/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/utils/cloudinary';
import useAuthStore from '@/store/useAuthStore';
import Link from 'next/link';

const ROLE_LABEL = { CLIENT: 'You', AGENT: 'Agent', ADMIN: 'Support' };

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i;
const isImageAttachment = (att) =>
  att.type === 'image' || (att.name && IMAGE_EXT.test(att.name)) || (att.url && /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i.test(att.url));
const isVideoAttachment = (att) =>
  att.type === 'video' || (att.name && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(att.name));

export default function SupportTicketPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (params.id && isLoggedIn) {
      fetchTicket();
    } else if (!isLoggedIn) {
      setLoading(false);
    }
  }, [params.id, isLoggedIn]);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/support/tickets/${params.id}`);
      if (res.data?.success) setTicket(res.data.ticket);
      else router.push('/support');
    } catch (e) {
      router.push('/support');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e, filesToSend) => {
    e?.preventDefault();
    const hasText = messageContent.trim().length > 0;
    const hasFiles = filesToSend && filesToSend.length > 0;
    if ((!hasText && !hasFiles) || sending) return;

    setSending(true);
    let attachments = [];
    if (hasFiles && filesToSend.length > 0) {
      if (filesToSend.length > 5) {
        toast.error('Maximum 5 attachments');
        setSending(false);
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      setUploading(true);
      try {
        for (const item of filesToSend) {
          const file = item.file;
          if (file.size > maxSize) {
            toast.error('Some files exceed 10MB');
            continue;
          }
          const resourceType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'raw';
          const url = await uploadToCloudinary(file, resourceType);
          attachments.push({ url, name: file.name, type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file' });
        }
      } catch (err) {
        toast.error('Upload failed');
        setSending(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    try {
      const res = await api.post(`/support/tickets/${params.id}/messages`, {
        content: messageContent.trim() || ' ',
        attachments: attachments.length ? attachments : undefined,
      });
      if (res.data?.success) {
        setTicket((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), res.data.message],
        }));
        setMessageContent('');
      } else {
        toast.error(res.data?.error || 'Failed to send');
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">Please sign in to view this ticket.</p>
        <Button className="mt-4" onClick={() => router.push('/login')}>Sign in</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) return null;

  const isOwner = user && (ticket.createdById === user.id || ticket.email === user.email);
  const chatEnabled = isOwner && !!ticket.assignedAgentId;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
    
      <Card className="mb-6 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="heading-3">My ticket — #{ticket.ticketNo}</CardTitle>
          {ticket.assignedAgent ? (
            <p className="text-sm text-muted-foreground">Agent assigned: {ticket.assignedAgent.name} — You can chat below.</p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              Waiting for an agent to be assigned. Chat will be enabled once assigned.
            </p>
          )}
        
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
          <p className="text-foreground whitespace-pre-wrap">{ticket.description}</p>
          {ticket.attachments?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-1">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((a) => (
                  <a key={a.id} href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {a.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        {/* <CardHeader className="py-3">
          <CardTitle className=" text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">Chat with support for this ticket.</p>
        </CardHeader> */}
        <CardContent className="p-0">
          <ScrollArea className="h-[320px] p-4 rounded-md">
            <div className="space-y-3 pr-2">
              {ticket.messages?.map((m, i) => {
                const isOwnMessage = m.role === 'CLIENT';
                return (
                  <div
                    key={m.id}
                    ref={i === (ticket.messages?.length ?? 0) - 1 ? lastMessageRef : null}
                    className={cn(
                      'flex w-full gap-2',
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                        <AvatarImage src={m.sender?.profileImage} alt={m.sender?.name} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {(m.sender?.name || ROLE_LABEL[m.role] || 'S').charAt(0).toUpperCase()}
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
                          {ROLE_LABEL[m.role] || m.sender?.name || 'Support'}
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
                        {m.content && m.content.trim() && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {m.content}
                          </p>
                        )}
                        {m.attachments?.length > 0 && (
                          <div className={cn('flex flex-col gap-2', m.content?.trim() && 'mt-2')}>
                            {m.attachments.map((a, idx) => (
                              <div key={idx}>
                                {isImageAttachment(a) ? (
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-lg overflow-hidden border border-black/10 max-w-[220px] max-h-48 focus:ring-2 focus:ring-primary focus:ring-offset-1"
                                  >
                                    <img
                                      src={a.url}
                                      alt={a.name || 'Image'}
                                      className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                      loading="lazy"
                                    />
                                    {a.name && (
                                      <p className="text-xs truncate px-1.5 py-1 bg-black/5">{a.name}</p>
                                    )}
                                  </a>
                                ) : isVideoAttachment(a) ? (
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/15 transition-colors"
                                  >
                                    <Paperclip className="h-4 w-4 shrink-0" />
                                    <span className="text-sm underline truncate flex-1">{a.name || 'Video'}</span>
                                    <span className="text-xs opacity-80">Open</span>
                                  </a>
                                ) : (
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/15 transition-colors"
                                  >
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="text-sm underline truncate flex-1">{a.name || 'Document'}</span>
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
                          {format(new Date(m.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    {isOwnMessage && (
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
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
          </ScrollArea>

          {isOwner && (
            <div className="mt-4 px-4 pb-4">
              {chatEnabled ? (
                <ChatInput
                  value={messageContent}
                  onChange={setMessageContent}
                  onSend={sendMessage}
                  placeholder="Type your message..."
                  disabled={sending || uploading}
                  sending={sending || uploading}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  Chat is enabled when an agent is assigned to this ticket. You’ll be able to send messages here once that happens.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
