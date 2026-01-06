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
import api from '@/utils/api';
import { toast } from 'sonner';

export default function AdminSellerApprovals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/seller-requests');
            setRequests(res.data);
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

    const handleApprove = async (id) => {
        try {
            await api.post(`/admin/seller-approve/${id}`);
            toast.success("Application approved!");
            fetchRequests();
        } catch (error) {
            toast.error("Failed to approve application.");
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason === null) return;

        try {
            await api.post(`/admin/seller-reject/${id}`, { reason });
            toast.success("Application rejected.");
            fetchRequests();
        } catch (error) {
            toast.error("Failed to reject application.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-normal text-foreground tracking-tight">Seller Verification</h2>
                    <p className="text-muted-foreground mt-1 text-sm font-normal">Review and approve new freelancer applications.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search applicants..." className="pl-10 h-10 bg-card border-border rounded-xl" />
                    </div>
                </div>
            </div>

            <Card className="rounded-[2rem] border-border overflow-hidden shadow-sm bg-card">
                <CardHeader className="p-8 border-b border-border bg-secondary/10">
                    <CardTitle className="text-xl font-normal">Pending Applications</CardTitle>
                    <CardDescription className="font-normal">{requests.length} applications awaiting review</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading applications...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">User</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Skills</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Applied Date</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">No pending applications</TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((req) => (
                                        <TableRow key={req._id} className="hover:bg-secondary/10 transition-colors border-b border-border group">
                                            <TableCell className="px-8 py-6">
                                                <div className="font-normal text-foreground">{req.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{req.userId?.email}</div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <div className="flex flex-wrap gap-1">
                                                    {req.skills.slice(0, 3).map(skill => (
                                                        <Badge key={skill} variant="secondary" className="bg-secondary text-[10px] font-normal">{skill}</Badge>
                                                    ))}
                                                    {req.skills.length > 3 && <Badge variant="outline" className="text-[10px] font-normal">+{req.skills.length - 3}</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-sm text-muted-foreground font-normal">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" className="rounded-lg h-9">
                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                    </Button>
                                                    <Button variant="secondary" size="sm" onClick={() => handleApprove(req._id)} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 rounded-lg h-9">
                                                        <Check className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleReject(req._id)} className="text-destructive hover:bg-destructive/10 rounded-lg h-9">
                                                        <X className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
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
        </div>
    );
}
