"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, Loader2 } from 'lucide-react';

export function SellerApplicationDialog({
    open,
    request,
    onClose,
    onApprove,
    onReject,
    actionLoading,
    pendingAction,
    rejectReason,
    onRejectReasonChange,
}) {
    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg rounded-2xl p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl">Seller application</DialogTitle>
                            <DialogDescription className="mt-1">Review details and approve or reject.</DialogDescription>
                        </div>
                        {request && (
                            <Badge
                                className={`shrink-0 font-medium ${request.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : request.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}
                            >
                                {request.status}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>
                {request && (
                    <div className="px-6 py-4 max-h-[min(60vh,400px)] overflow-y-auto space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Name</p>
                                <p className="text-foreground font-medium">{request.fullName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Applied</p>
                                <p className="text-sm text-foreground">{request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                            <p className="text-foreground text-sm">{request.user?.email ?? request.userId?.email ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {(request.skills || []).map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs font-normal">{skill}</Badge>
                                ))}
                                {(!request.skills || request.skills.length === 0) && <span className="text-sm text-muted-foreground">—</span>}
                            </div>
                        </div>
                        {request.bio && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
                                <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{request.bio}</p>
                            </div>
                        )}
                        {request.portfolio && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Portfolio</p>
                                <a
                                    href={request.portfolio}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                                >
                                    {request.portfolio}
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                </a>
                            </div>
                        )}
                    </div>
                )}
                {request?.status === 'PENDING' && (
                    <>
                        <div className="px-6 pt-2 pb-4 border-t border-border space-y-3">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                                Rejection reason (optional)
                            </label>
                            <textarea
                                placeholder="Add a reason if rejecting..."
                                value={rejectReason}
                                onChange={(e) => onRejectReasonChange(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            />
                        </div>
                        <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border flex-row justify-end gap-2">
                            <Button variant="outline" onClick={onClose} disabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button onClick={() => onApprove(request.id)} disabled={actionLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {pendingAction === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                <span className="ml-1.5">{pendingAction === 'approve' ? 'Approving…' : 'Approve'}</span>
                            </Button>
                            <Button variant="destructive" onClick={onReject} disabled={actionLoading}>
                                {pendingAction === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                <span className="ml-1.5">{pendingAction === 'reject' ? 'Rejecting…' : 'Reject'}</span>
                            </Button>
                        </DialogFooter>
                    </>
                )}
                {request?.status !== 'PENDING' && (
                    <div className="px-6 py-4 border-t border-border flex justify-end">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default SellerApplicationDialog;
