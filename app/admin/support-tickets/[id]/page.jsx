'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, CheckCircle2, Circle, Paperclip, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatInput } from '@/components/chat/ChatInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils';
import api from '@/utils/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { uploadToCloudinary } from '@/utils/cloudinary';
import useAuthStore from '@/store/useAuthStore';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import Link from 'next/link';

const STATUS_STEPS = [
  { key: 'OPEN', label: 'Service request opened' },
  { key: 'AGENT_ASSIGNED', label: 'Agent assigned', sub: 'A support agent is reviewing your request and will contact you soon' },
  { key: 'RESOLVED', label: 'Issue resolved' },
];

const ROLE_LABEL = { CLIENT: 'Client', AGENT: 'Agent', ADMIN: 'Support' };

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i;
const isImageAttachment = (a) =>
  a.type === 'image' || (a.name && IMAGE_EXT.test(a.name)) || (a.url && /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i.test(a.url));
const isVideoAttachment = (a) =>
  a.type === 'video' || (a.name && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(a.name));

export default function AdminSupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const lastMessageRef = useRef(null);
  const { socket } = useGlobalSocket();

  useEffect(() => {
    if (params.id) {
      fetchTicket();
      fetchAdmins();
    }
  }, [params.id]);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  // Real-time: subscribe to support ticket room
  useEffect(() => {
    if (!socket || !params.id || !ticket?.id) return;
    const ticketId = String(ticket.id);
    socket.emit('supportTicket:subscribe', { ticketId });
    return () => socket.emit('supportTicket:unsubscribe', { ticketId });
  }, [socket, params.id, ticket?.id]);

  // Real-time: listen for new messages (only add client messages from socket; our own agent/admin replies are added from API to avoid duplicate)
  useEffect(() => {
    if (!socket || !ticket?.id) return;
    const ticketIdStr = String(ticket.id);
    const handleNewMessage = (data) => {
      if (String(data?.ticketId) !== ticketIdStr || !data?.message) return;
      const msg = data.message;
      if (msg.role !== 'CLIENT') return;
      setTicket((prev) => {
        if (!prev || prev.messages?.some((m) => m.id === msg.id)) return prev;
        return { ...prev, messages: [...(prev.messages || []), msg] };
      });
    };
    socket.on('supportTicket:new_message', handleNewMessage);
    return () => socket.off('supportTicket:new_message', handleNewMessage);
  }, [socket, ticket?.id]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/support/tickets/${params.id}`);
      if (res.data?.success) setTicket(res.data.ticket);
      else router.push('/admin/support-tickets');
    } catch (e) {
      router.push('/admin/support-tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/users', { params: { role: 'ADMIN' } });
      if (res.data?.success) setAdmins(res.data.users || []);
    } catch (e) {
      setAdmins([]);
    }
  };

  const handleAssignAgent = async (agentId) => {
    setAssigning(true);
    try {
      const res = await api.patch(`/support/tickets/${params.id}`, {
        assignedAgentId: agentId || null,
        status: agentId ? 'AGENT_ASSIGNED' : 'OPEN',
      });
      if (res.data?.success) {
        setTicket((prev) => ({ ...prev, ...res.data.ticket }));
        toast.success(agentId ? 'Agent assigned' : 'Assignment removed');
      } else toast.error(res.data?.error || 'Failed to update');
    } catch (e) {
      toast.error('Failed to assign agent');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await api.patch(`/support/tickets/${params.id}`, { status });
      if (res.data?.success) setTicket((prev) => ({ ...prev, status: res.data.ticket.status }));
      else toast.error('Failed to update status');
    } catch (e) {
      toast.error('Failed to update status');
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
        const newMsg = res.data.message;
        setTicket((prev) => {
          if (!prev) return prev;
          if (prev.messages?.some((m) => m.id === newMsg?.id)) return prev;
          return { ...prev, messages: [...(prev.messages || []), newMsg] };
        });
        setMessageContent('');
      } else toast.error(res.data?.error || 'Failed to send');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton: Service request card */}
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-[200px]" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        {/* Skeleton: Status timeline card */}
        <Card className="shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                    {i < 3 && <div className="w-0.5 flex-1 min-h-[24px] bg-border my-0.5" />}
                  </div>
                  <div className="pb-4">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </CardContent>
        </Card>

        {/* Skeleton: Message thread card */}
        <Card className="shadow-none">
          <CardContent className="p-0">
            <div className="h-[380px] p-4 space-y-3">
              <div className="flex gap-2 justify-start">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-12 w-64 rounded-lg" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="space-y-2 items-end flex flex-col">
                  <Skeleton className="h-12 w-56 rounded-lg" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              </div>
              <div className="flex gap-2 justify-start">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-10 w-72 rounded-lg" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) return null;

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === ticket.status);

  return (
    <div className="space-y-6">
      {/* <Link
        href="/admin/support-tickets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link> */}

      <Card className=" shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-normal">Service request</CardTitle>
          <p className="text-muted-foreground font-mono">Ticket No: {ticket.ticketNo}</p>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-sm">Agent assign:</Label>
              <Select
                value={ticket.assignedAgentId || 'none'}
                onValueChange={(v) => handleAssignAgent(v === 'none' ? null : v)}
                disabled={assigning}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unassigned —</SelectItem>
                  {admins.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Created by {ticket.fullName} on {format(new Date(ticket.createdAt), 'dd-MMM-yyyy')} at {format(new Date(ticket.createdAt), 'h:mm a')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
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

      {/* Status timeline */}
      <Card className=" shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {STATUS_STEPS.map((step, i) => {
              const done = currentStepIndex >= i;
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        done ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    {i < STATUS_STEPS.length - 1 && <div className="w-0.5 flex-1 min-h-[24px] bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">{step.label}</p>
                    {step.sub && <p className="text-sm text-muted-foreground mt-0.5">{step.sub}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Label className="text-sm text-muted-foreground">Update status</Label>
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[200px] mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_STEPS.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Message thread — same bubble design as client ticket & disputes */}
      <Card className=" shadow-none">
        {/* <CardHeader className="py-4 pb-2">
          <CardTitle className="text-lg font-normal flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ticket communication
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">Chat with the client. Replies appear on the right.</p>
        </CardHeader> */}
        <CardContent className="p-0">
          <ScrollArea className="h-[380px] p-4 rounded-md">
            <div className="space-y-3 pr-2">
              {ticket.messages?.map((m, i) => {
                const isOwnMessage = m.role !== 'CLIENT';
                return (
                  <div
                    key={m.id}
                    ref={i === (ticket.messages?.length ?? 0) - 1 ? lastMessageRef : null}
                    className={cn('flex w-full gap-2', isOwnMessage ? 'justify-end' : 'justify-start')}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8 shrink-0 mt-1">
                        <AvatarImage src={m.sender?.profileImage} alt={m.sender?.name} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {(m.sender?.name || ROLE_LABEL[m.role] || 'C').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn('flex flex-col gap-1 max-w-[70%] min-w-0', isOwnMessage ? 'items-end' : 'items-start')}>
                      {!isOwnMessage && (
                        <p className="text-xs font-medium text-muted-foreground px-1">
                          {ROLE_LABEL[m.role] || m.sender?.name || 'Client'}
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
                          <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
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
                                    {a.name && <p className="text-xs truncate px-1.5 py-1 bg-black/5">{a.name}</p>}
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
                      <div className={cn('flex items-center gap-1 px-1', isOwnMessage ? 'justify-end' : 'justify-start')}>
                        <p className="text-xs text-muted-foreground">{format(new Date(m.createdAt), 'h:mm a')}</p>
                      </div>
                    </div>
                    {isOwnMessage && (
                      <Avatar className="h-8 w-8 shrink-0 mt-1">
                        <AvatarImage src={user?.profileImage} alt={user?.name} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {(user?.name || ROLE_LABEL[m.role] || 'A').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="mt-4 px-4 pb-4">
            <ChatInput
              value={messageContent}
              onChange={setMessageContent}
              onSend={sendMessage}
              placeholder="Reply to client..."
              disabled={sending || uploading}
              sending={sending || uploading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
