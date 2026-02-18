'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, UserPlus, Store, Eye, MapPin, Phone, Mail, User, Calendar, FileText } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function AdminJoinRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/role-agreement-requests');
      if (res.data?.success) setRequests(res.data.requests || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load join requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, status, reason = '') => {
    if (status === 'REJECTED' && !reason) {
      reason = window.prompt('Enter rejection reason (optional):') || '';
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/role-agreement-requests/${id}/status`, { status, reason });
      toast.success(`Request ${status.toLowerCase()}!`);
      fetchRequests();
    } catch (error) {
      toast.error(`Failed to ${status.toLowerCase()} request.`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-normal text-foreground tracking-tight">Join requests</h2>
        <p className="text-muted-foreground mt-1 text-sm font-normal">
          Approve or reject requests from users to join as Client or Seller after they accept the agreement.
        </p>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-xl font-normal">Requests list</CardTitle>
          <CardDescription className="font-normal">
            {pendingCount} request{pendingCount !== 1 ? 's' : ''} pending · {requests.length} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">User</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Requested role</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Agreed at</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="border-b border-border">
                    <TableCell className="px-8 py-6">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-9 w-24 rounded-lg" />
                        <Skeleton className="h-9 w-20 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">User</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Requested role</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Agreed at</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      No join requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-secondary/10 transition-colors border-b border-border">
                      <TableCell className="px-8 py-6">
                        <div className="font-normal text-foreground">{req.user?.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{req.user?.email}</div>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        {req.requestedRole === 'FREELANCER' ? (
                          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                            <Store className="w-3 h-3" /> Seller
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">
                            <UserPlus className="w-3 h-3" /> Client
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <Badge
                          variant="secondary"
                          className={
                            req.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : req.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-sm text-muted-foreground">
                        {req.agreedAt ? format(new Date(req.agreedAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                        
                          {req.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                disabled={actionLoading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-9"
                              >
                                <Check className="w-4 h-4 " /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                disabled={actionLoading}
                                className="text-destructive hover:bg-destructive/10 rounded-lg h-9"
                              >
                                <X className="w-4 h-4 " /> Reject
                              </Button>
                            </>
                          )}
  <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(req)}
                            className="rounded-lg h-9"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User & request details modal */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 pt-2">
              {/* User section */}
              <div>
                {/* <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> User
                </h4> */}
                <div className="flex items-start gap-4 pb-3 border-b border-border">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={selectedRequest.user?.profileImage} alt={selectedRequest.user?.name} />
                    <AvatarFallback className="text-lg">
                      {selectedRequest.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-medium text-foreground">{selectedRequest.user?.name || '—'}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.user?.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{selectedRequest.user?.role}</Badge>
                      <Badge variant="outline">
                        Seller: {selectedRequest.user?.isSeller ? 'Yes' : 'No'} · {selectedRequest.user?.sellerStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-0 mt-2">
                  <DetailRow icon={Mail} label="Email" value={selectedRequest.user?.email} />
                  <DetailRow icon={Phone} label="Phone" value={selectedRequest.user?.phoneNumber} />
                  <DetailRow icon={MapPin} label="Location" value={selectedRequest.user?.location} />
                  <DetailRow
                    icon={Calendar}
                    label="Account created"
                    value={selectedRequest.user?.createdAt ? format(new Date(selectedRequest.user.createdAt), 'dd MMM yyyy, HH:mm') : null}
                  />
                  {selectedRequest.user?.bio && (
                    <DetailRow icon={User} label="Bio" value={selectedRequest.user.bio} />
                  )}
                </div>
              </div>

              {/* Request section */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Join request
                </h4>
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-0">
                  <DetailRow
                    label="Requested role"
                    value={selectedRequest.requestedRole === 'FREELANCER' ? 'Seller' : 'Client'}
                  />
                  <DetailRow
                    label="Status"
                    value={selectedRequest.status}
                  />
                  <DetailRow
                    label="Agreed at"
                    value={selectedRequest.agreedAt ? format(new Date(selectedRequest.agreedAt), 'dd MMM yyyy, HH:mm') : null}
                  />
                  <DetailRow
                    label="Request created"
                    value={selectedRequest.createdAt ? format(new Date(selectedRequest.createdAt), 'dd MMM yyyy, HH:mm') : null}
                  />
                  {selectedRequest.reviewedAt && (
                    <DetailRow
                      label="Reviewed at"
                      value={format(new Date(selectedRequest.reviewedAt), 'dd MMM yyyy, HH:mm')}
                    />
                  )}
                  {selectedRequest.rejectionReason && (
                    <DetailRow label="Rejection reason" value={selectedRequest.rejectionReason} />
                  )}
                </div>
              </div>

              {/* Actions in modal */}
              <div className="flex justify-end gap-2 py-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg "
                >
                  Close
                </Button>
                {selectedRequest.status === 'PENDING' && (
                  <>
                    <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(selectedRequest.id, 'APPROVED');
                      setSelectedRequest(null);
                    }}
                    disabled={actionLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg "
                  >
                    <Check className="w-4 h-4 " /> Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(selectedRequest.id, 'REJECTED');
                      setSelectedRequest(null);
                    }}
                    disabled={actionLoading}
                    className="text-destructive hover:bg-destructive/10 rounded-lg "
                  >
                    <X className="w-4 h-4 " /> Reject
                  </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
