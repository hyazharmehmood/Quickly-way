"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, User, Shield, CheckCircle2, FileText, Calendar, Clock, HelpCircle, CheckSquare, Info, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/utils';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uploadToCloudinary } from '@/utils/cloudinary';
import useAuthStore from '@/store/useAuthStore';

const ROLE_CONFIG = {
  CLIENT: { label: 'Client' },
  FREELANCER: { label: 'Seller' },
  ADMIN: { label: 'Admin' },
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i;
const isImageAttachment = (att) =>
  att.type === 'image' || (att.name && IMAGE_EXT.test(att.name)) || (att.url && /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i.test(att.url));
const isVideoAttachment = (att) =>
  att.type === 'video' || (att.name && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(att.name));

export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [dispute, setDispute] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [orderAction, setOrderAction] = useState('NONE');
  const [resolving, setResolving] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState(null);
  const [requestTarget, setRequestTarget] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (params.id) {
      fetchDispute();
      fetchComments();
    }
  }, [params.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const fetchDispute = async () => {
    try {
  
      const response = await api.get(`/admin/disputes/${params.id}`);
      if (response.data.success) {
        setDispute(response.data.dispute);
      }
    } catch (error) {
      console.error('Error fetching dispute:', error);
      toast.error('Failed to fetch dispute');
      router.push('/admin/disputes');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/disputes/${params.id}/comments`);
      if (response.data.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSendComment = async (e, filesToUpload = null) => {
    e?.preventDefault();

    let finalAttachments = [...attachments];
    if (filesToUpload && filesToUpload.length > 0) {
      setUploading(true);
      try {
        if (finalAttachments.length + filesToUpload.length > 5) {
          toast.error('Maximum 5 attachments allowed');
          return;
        }
        const maxSize = 10 * 1024 * 1024;
        const oversized = filesToUpload.filter((item) => item.file && item.file.size > maxSize);
        if (oversized.length > 0) {
          toast.error('Some files exceed 10MB limit');
          return;
        }
        const uploaded = await Promise.all(
          filesToUpload.map(async (item) => {
            const url = await uploadToCloudinary(item.file);
            return {
              url,
              name: item.file.name,
              type: item.file.type.startsWith('image/') ? 'image' : item.file.type.startsWith('video/') ? 'video' : 'file',
              size: item.file.size,
            };
          })
        );
        finalAttachments = [...finalAttachments, ...uploaded];
      } catch (err) {
        toast.error('Failed to upload files');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
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
      const response = await api.post(`/disputes/${dispute.id}/comments`, {
        content: commentContent.trim() || '(No text)',
        attachments: finalAttachments.length > 0 ? finalAttachments : null,
      });

      if (response.data.success) {
        setCommentContent('');
        setAttachments([]);
        await fetchComments();
        // toast.success('Comment added');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      toast.error(error.response?.data?.error || 'Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  const handleRequestInfo = (type, target) => {
    setRequestType(type);
    setRequestTarget(target);
    setRequestMessage('');
    setShowRequestDialog(true);
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSending(true);
      const targetName = requestTarget === 'CLIENT' ? dispute.client.name : dispute.freelancer.name;
      const message = `@${targetName} - ${requestType === 'MORE_INFO' ? 'Please provide more details' : requestType === 'APPROVAL' ? 'Please confirm/approve' : 'Please clarify'}: ${requestMessage}`;
      
      const response = await api.post(`/disputes/${dispute.id}/comments`, {
        content: message,
        attachments: null,
      });

      if (response.data.success) {
        setShowRequestDialog(false);
        setRequestMessage('');
        setRequestType(null);
        setRequestTarget(null);
        await fetchComments();
        toast.success('Request sent');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request');
    } finally {
      setSending(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!resolutionText.trim()) {
      toast.error('Please provide a resolution text');
      return;
    }

    try {
      setResolving(true);
      const response = await api.patch(`/admin/disputes/${dispute.id}`, {
        status: 'RESOLVED',
        adminResolution: resolutionText,
        orderAction,
      });

      if (response.data.success) {
        toast.success('Dispute resolved successfully');
        setShowResolveDialog(false);
        setResolutionText('');
        setOrderAction('NONE');
        await fetchDispute();
        await fetchComments();
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.response?.data?.error || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const response = await api.patch(`/admin/disputes/${dispute.id}`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast.success(`Dispute status updated to ${newStatus}`);
        await fetchDispute();
      }
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast.error(error.response?.data?.error || 'Failed to update dispute status');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Dispute not found</p>
        <Button onClick={() => router.push('/admin/disputes')} className="mt-4">
          Back to Disputes
        </Button>
      </div>
    );
  }

  const canComment = dispute.status === 'OPEN' || dispute.status === 'IN_REVIEW';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/disputes')}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-normal text-foreground">Dispute Details</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Order: {dispute.order?.orderNumber || dispute.orderId?.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {dispute.status === 'OPEN' && (
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus('IN_REVIEW')}
            >
              <Clock className="w-4 h-4" /> Mark In Review
            </Button>
          )}
          {canComment && (
            <Button
              onClick={() => setShowResolveDialog(true)}
              className="bg-primary"
            >
              <CheckCircle2 className="w-4 h-4" /> Resolve Dispute
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Dispute Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card className="rounded-4xl border-none">
            <CardHeader>
              <CardTitle className="text-lg font-normal">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label className="text-xs text-muted-foreground uppercase">Service</Label>
                  <p className="text-sm font-medium truncate">{dispute.order?.service?.title || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <Label className="text-xs text-muted-foreground uppercase">Amount</Label>
                  <p className="text-sm font-medium truncate">
                    {formatCurrency(dispute.order?.price || 0, dispute.order?.currency)}
                  </p>
                </div>
                <div className="min-w-0">
                  <Label className="text-xs text-muted-foreground uppercase">Client</Label>
                  <p className="text-sm font-medium truncate">{dispute.client?.name || 'Unknown'}</p>
                </div>
                <div className="min-w-0">
                  <Label className="text-xs text-muted-foreground uppercase">Seller</Label>
                  <p className="text-sm font-medium truncate">{dispute.freelancer?.name || 'Unknown'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Thread */}
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-normal flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Dispute Thread
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] px-6" ref={scrollRef}>
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
                                <img src={att.url} alt={att.name || 'Image'} className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" loading="lazy" />
                                {att.name && <p className="text-xs truncate px-1.5 py-1 bg-black/5">{att.name}</p>}
                              </a>
                            ) : isVideoAttachment(att) ? (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-white border border-red-200 text-xs hover:bg-red-50">
                                <Paperclip className="h-4 w-4 shrink-0" />
                                <span className="underline truncate max-w-[140px]">{att.name || 'Video'}</span>
                                <span className="opacity-80">Open</span>
                              </a>
                            ) : (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-white border border-red-200 text-xs hover:bg-red-50">
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
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No comments yet</div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const isOwnMessage = comment.userId === user?.id;
                        const roleLabel = (ROLE_CONFIG[comment.role] || ROLE_CONFIG.CLIENT).label;
                        return (
                          <div
                            key={comment.id}
                            className={cn('flex w-full gap-2', isOwnMessage ? 'justify-end' : 'justify-start')}
                          >
                            {!isOwnMessage && (
                              <Avatar className="h-8 w-8 shrink-0 mt-1">
                                <AvatarImage src={comment.user?.profileImage} alt={comment.user?.name} />
                                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                  {(comment.user?.name || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn('flex flex-col gap-1 max-w-[70%] min-w-0', isOwnMessage ? 'items-end' : 'items-start')}>
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
                                {comment.content && comment.content.trim() && (
                                  <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
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
                                            <img src={att.url} alt={att.name || 'Image'} className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" loading="lazy" />
                                            {att.name && <p className="text-xs truncate px-1.5 py-1 bg-black/5">{att.name}</p>}
                                          </a>
                                        ) : isVideoAttachment(att) ? (
                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/15 transition-colors">
                                            <Paperclip className="h-4 w-4 shrink-0" />
                                            <span className="text-sm underline truncate flex-1">{att.name || 'Video'}</span>
                                            <span className="text-xs opacity-80">Open</span>
                                          </a>
                                        ) : (
                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/15 transition-colors">
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
                              <div className={cn('flex items-center gap-1 px-1', isOwnMessage ? 'justify-end' : 'justify-start')}>
                                <p className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), 'h:mm a')}</p>
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
              {canComment && (
                <div className="p-6 border-t border-border">
                  <ChatInput
                    value={commentContent}
                    onChange={(value) => setCommentContent(value)}
                    onSend={(e, files) => handleSendComment(e, files)}
                    placeholder="Add a comment or ask for clarification..."
                    disabled={sending || uploading}
                    sending={sending || uploading}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6 min-w-0">
          {/* Dispute Info */}
          <Card className="rounded-4xl border-none">
            <CardHeader>
              <CardTitle className="text-lg font-normal">Dispute Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className='flex items-center justify-between gap-2 '>
                <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                <Badge variant="destructive" className="mt-1">
                  {dispute.status}
                </Badge>
              </div>
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground uppercase">Reason</Label>
                <p className="text-sm mt-1 break-words">{dispute.reason}</p>
              </div>
              {dispute.adminResolution && (
                <div className="min-w-0">
                  <Label className="text-xs text-muted-foreground uppercase">Resolution</Label>
                  <p className="text-sm mt-1 break-words">{dispute.adminResolution}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {canComment && (
            <Card className="rounded-4xl border-none">
              <CardHeader>
                <CardTitle className="text-lg font-normal">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => handleRequestInfo('MORE_INFO', 'CLIENT')}
                >
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="text-xs leading-tight">Request More Info from Client</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => handleRequestInfo('MORE_INFO', 'FREELANCER')}
                >
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="text-xs leading-tight">Request More Info from Seller</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => handleRequestInfo('APPROVAL', 'CLIENT')}
                >
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span className="text-xs leading-tight">Request Approval from Client</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => handleRequestInfo('APPROVAL', 'FREELANCER')}
                >
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span className="text-xs leading-tight">Request Approval from Seller</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => handleRequestInfo('CLARIFICATION', 'CLIENT')}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs leading-tight">Ask Client for Clarification</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3"
                  onClick={() => handleRequestInfo('CLARIFICATION', 'FREELANCER')}
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span className="text-xs leading-tight">Ask Seller for Clarification</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* User Info */}
          <Card className="rounded-4xl border-none">
            <CardHeader>
              <CardTitle className="text-lg font-normal">Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Client</Label>
                <div className="flex items-center gap-2 mt-2">
                  {dispute.client?.profileImage ? (
                    <img src={dispute.client.profileImage} alt={dispute.client.name} className="w-8 h-8 rounded-full shrink-0" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{dispute.client?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{dispute.client?.email}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Seller</Label>
                <div className="flex items-center gap-2 mt-2">
                  {dispute.freelancer?.profileImage ? (
                    <img src={dispute.freelancer.profileImage} alt={dispute.freelancer.name} className="w-8 h-8 rounded-full shrink-0" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{dispute.freelancer?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{dispute.freelancer?.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {requestType === 'MORE_INFO' && 'Request More Information'}
              {requestType === 'APPROVAL' && 'Request Approval'}
              {requestType === 'CLARIFICATION' && 'Request Clarification'}
            </DialogTitle>
            <DialogDescription>
              Send a message to {requestTarget === 'CLIENT' ? dispute.client?.name : dispute.freelancer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Message *</Label>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendRequest} disabled={sending || !requestMessage.trim()}>
              {sending ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide a resolution for this dispute. This action will be recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Dispute Details:</p>
              <p className="text-sm text-muted-foreground mb-1"><strong>Reason:</strong> {dispute.reason}</p>
              <p className="text-sm text-muted-foreground mb-1"><strong>Description:</strong> {dispute.description}</p>
              <p className="text-sm text-muted-foreground"><strong>Order:</strong> {dispute.order?.orderNumber || dispute.orderId}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Text *</Label>
              <Textarea
                id="resolution"
                placeholder="Enter your resolution for this dispute..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderAction">Order Action</Label>
              <Select value={orderAction} onValueChange={setOrderAction}>
                <SelectTrigger id="orderAction">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Action</SelectItem>
                  <SelectItem value="REFUND_CLIENT">Refund Client</SelectItem>
                  <SelectItem value="PAY_FREELANCER">Pay Seller</SelectItem>
                  <SelectItem value="SPLIT">Split Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveDispute} disabled={resolving || !resolutionText.trim()}>
              {resolving ? 'Resolving...' : 'Resolve Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

