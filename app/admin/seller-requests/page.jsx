"use client";

import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { SellerApplicationDialog } from '@/components/admin/SellerApplicationDialog';
import { SellerRequestsTableSkeleton } from '@/components/admin/SellerRequestsTableSkeleton';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function AdminSellerRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewRequest, setViewRequest] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'approve' | 'reject'

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/seller-requests');
            setRequests(res.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load seller requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id, status, reason = '') => {
        if (status === 'REJECTED' && !reason) {
            reason = window.prompt("Enter rejection reason:");
            if (reason === null) return;
        }
        setActionLoading(true);
        setPendingAction(status === 'APPROVED' ? 'approve' : 'reject');
        try {
            await api.patch(`/admin/seller-requests/${id}/status`, { status, reason });
            toast.success(`Application ${status.toLowerCase()}!`);
            setViewRequest(null);
            setRejectReason('');
            fetchRequests();
        } catch (error) {
            toast.error(`Failed to ${status.toLowerCase()} application.`);
        } finally {
            setActionLoading(false);
            setPendingAction(null);
        }
    };

    const handleRejectFromDialog = () => {
        if (!viewRequest) return;
        const reason = rejectReason.trim() || window.prompt("Enter rejection reason:");
        if (reason === null && !rejectReason.trim()) return;
        handleUpdateStatus(viewRequest.id, 'REJECTED', reason || rejectReason);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-normal text-foreground tracking-tight">Seller Requests</h2>
                    <p className="text-muted-foreground mt-1 text-sm font-normal">Review and approve new freelancer applications.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search applicants..." className="pl-10 " />
                    </div>
                </div>
            </div>

                <Card className="border-none shadow-none">
                <CardHeader className="px-0 ">
                    <CardTitle className="text-xl font-normal">Requests List</CardTitle>
                    <CardDescription className="font-normal">{requests.length} applications awaiting review</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <SellerRequestsTableSkeleton />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">User</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Skills</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Status</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Applied Date</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">No applications found</TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((req) => (
                                        <TableRow key={req.id} className="hover:bg-secondary/10 transition-colors border-b border-border group">
                                            <TableCell className="px-8 py-6">
                                                <div className="font-normal text-foreground">{req.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{req.user?.email ?? req.userId?.email}</div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <div className="flex flex-wrap gap-1">
                                                    {(req.skills || []).slice(0, 3).map(skill => (
                                                        <Badge key={skill} variant="secondary" className="bg-secondary text-[10px] font-normal">{skill}</Badge>
                                                    ))}
                                                    {(req.skills || []).length > 3 && <Badge variant="outline" className="text-[10px] font-normal">+{(req.skills || []).length - 3}</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <Badge
                                                    variant={
                                                        req.status === 'APPROVED' ? 'success' :
                                                            req.status === 'REJECTED' ? 'destructive' :
                                                                'secondary'
                                                    }
                                                    className={`text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                            'bg-orange-100 text-orange-700 hover:bg-orange-100'
                                                        }`}
                                                >
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-sm text-muted-foreground font-normal">
                                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="rounded-lg h-9" onClick={() => setViewRequest(req)}>
                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                    </Button>
                                                    {req.status === 'PENDING' && (
                                                        <>
                                                            <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(req.id, 'APPROVED')} disabled={actionLoading} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-lg h-9">
                                                                <Check className="w-4 h-4 mr-1" /> Approve
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(req.id, 'REJECTED')} disabled={actionLoading} className="text-destructive hover:bg-destructive/10 rounded-lg h-9">
                                                                <X className="w-4 h-4 mr-1" /> Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <SellerApplicationDialog
                open={!!viewRequest}
                request={viewRequest}
                onClose={() => { setViewRequest(null); setRejectReason(''); }}
                onApprove={(id) => handleUpdateStatus(id, 'APPROVED')}
                onReject={handleRejectFromDialog}
                actionLoading={actionLoading}
                pendingAction={pendingAction}
                rejectReason={rejectReason}
                onRejectReasonChange={setRejectReason}
            />
        </div>
    );
}
