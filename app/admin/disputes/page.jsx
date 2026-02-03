"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, AlertTriangle, ShieldCheck, Activity, Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
    OPEN: { label: 'OPEN', color: 'bg-red-100 text-red-600 border-red-200', priority: 'High' },
    IN_REVIEW: { label: 'IN REVIEW', color: 'bg-orange-100 text-orange-600 border-orange-200', priority: 'Medium' },
    RESOLVED: { label: 'RESOLVED', color: 'bg-green-100 text-green-600 border-green-200', priority: 'Low' },
    CLOSED: { label: 'CLOSED', color: 'bg-gray-100 text-gray-600 border-gray-200', priority: 'Low' },
};

export default function DisputesPage() {
    const router = useRouter();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        open: 0,
        inReview: 0,
        resolved: 0,
        closed: 0,
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolutionText, setResolutionText] = useState('');
    const [orderAction, setOrderAction] = useState('NONE');
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        fetchDisputes();
    }, [statusFilter]);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const response = await api.get('/admin/disputes', { params });
            if (response.data.success) {
                setDisputes(response.data.disputes || []);
                setMetrics(response.data.metrics || {
                    open: 0,
                    inReview: 0,
                    resolved: 0,
                    closed: 0,
                });
            }
        } catch (error) {
            console.error('Error fetching disputes:', error);
            toast.error('Failed to fetch disputes');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (dispute) => {
        try {
            const response = await api.get(`/admin/disputes/${dispute.id}`);
            if (response.data.success) {
                setSelectedDispute(response.data.dispute);
                setResolveDialogOpen(true);
            }
        } catch (error) {
            console.error('Error fetching dispute details:', error);
            toast.error('Failed to fetch dispute details');
        }
    };

    const handleResolveDispute = async () => {
        if (!resolutionText.trim()) {
            toast.error('Please provide a resolution text');
            return;
        }

        try {
            setResolving(true);
            const response = await api.patch(`/admin/disputes/${selectedDispute.id}`, {
                status: 'RESOLVED',
                adminResolution: resolutionText,
                orderAction,
            });

            if (response.data.success) {
                toast.success('Dispute resolved successfully');
                setResolveDialogOpen(false);
                setResolutionText('');
                setOrderAction('NONE');
                setSelectedDispute(null);
                fetchDisputes();
            }
        } catch (error) {
            console.error('Error resolving dispute:', error);
            toast.error(error.response?.data?.error || 'Failed to resolve dispute');
        } finally {
            setResolving(false);
        }
    };

    const handleUpdateStatus = async (disputeId, newStatus) => {
        try {
            const response = await api.patch(`/admin/disputes/${disputeId}`, {
                status: newStatus,
            });

            if (response.data.success) {
                toast.success(`Dispute status updated to ${newStatus}`);
                fetchDisputes();
            }
        } catch (error) {
            console.error('Error updating dispute status:', error);
            toast.error(error.response?.data?.error || 'Failed to update dispute status');
        }
    };

    const getStatusBadge = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
        return (
            <Badge variant="outline" className={`px-5 py-1.5 rounded-full text-[9px] font-normal uppercase tracking-[0.2em] shadow-sm border-0 ${config.color}`}>
                {config.label}
            </Badge>
        );
    };

    const getPriorityBadge = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
        const priorityColors = {
            High: 'bg-destructive/10 text-destructive border-destructive/20',
            Medium: 'bg-orange-50/50 text-orange-600 border-orange-100',
            Low: 'bg-gray-50/50 text-gray-600 border-gray-100',
        };
        return (
            <Badge variant="outline" className={`px-5 py-1.5 rounded-full text-[9px] font-normal uppercase tracking-[0.2em] shadow-sm border-0 ${priorityColors[config.priority]}`}>
                Priority: {config.priority}
            </Badge>
        );
    };

    const filteredDisputes = disputes.filter(dispute => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            dispute.reason?.toLowerCase().includes(query) ||
            dispute.description?.toLowerCase().includes(query) ||
            dispute.order?.orderNumber?.toLowerCase().includes(query) ||
            dispute.client?.name?.toLowerCase().includes(query) ||
            dispute.freelancer?.name?.toLowerCase().includes(query)
        );
    });

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount || 0);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    title="Critical" 
                    value={metrics.open.toString()} 
                    trend="Active priority" 
                    icon={<AlertTriangle className="text-destructive" />} 
                />
                <MetricCard 
                    title="Moderate" 
                    value={metrics.inReview.toString()} 
                    trend="Pending review" 
                    icon={<ShieldAlert className="text-orange-500" />} 
                />
                <MetricCard 
                    title="Resolved" 
                    value={metrics.resolved.toString()} 
                    trend="Total solved" 
                    icon={<ShieldCheck />} 
                />
                <MetricCard 
                    title="Safe Ratio" 
                    value={metrics.total > 0 ? `${Math.round(((metrics.resolved + metrics.closed) / metrics.total) * 100)}%` : '100%'} 
                    trend="Trusted score" 
                    icon={<Activity />} 
                />
            </div>

            <Card className="border-none rounded-[2rem]">
                <CardHeader className="p-10 border-b rounded-t-[1.5rem] border-border flex flex-row justify-between items-center bg-card">
                    <CardTitle className="text-xl font-normal text-foreground">Case Unit</CardTitle>
                    <div className="flex gap-3">
                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Search disputes..." 
                                className="pl-10 h-11 bg-card border-border rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-11 w-40 rounded-xl border-border">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchDisputes}
                            className="h-11 w-11 rounded-xl"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border">
                    {loading ? (
                        <div className="p-10 space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : filteredDisputes.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground">
                            {disputes.length === 0 ? 'No disputes found' : 'No disputes match your filters'}
                        </div>
                    ) : (
                        filteredDisputes.map((dispute) => (
                        <div key={dispute.id} className="p-10 hover:bg-secondary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                        {getPriorityBadge(dispute.status)}
                                    <span className="text-sm text-muted-foreground font-normal flex items-center gap-1.5 uppercase tracking-widest">
                                            <Calendar className="w-4 h-4" /> Filed {format(new Date(dispute.createdAt), 'MMM d')}
                                    </span>
                                        {getStatusBadge(dispute.status)}
                                </div>
                                <h4 className="text-xl font-normal text-foreground mb-2">{dispute.reason} Complaint</h4>
                                    <p className="text-base text-muted-foreground font-normal leading-relaxed max-w-4xl mb-2">{dispute.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>Order: {dispute.order?.orderNumber || dispute.orderId?.slice(0, 8)}</span>
                                        <span>•</span>
                                        <span>Client: {dispute.client?.name || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>Freelancer: {dispute.freelancer?.name || 'Unknown'}</span>
                                        {dispute.order?.price && (
                                            <>
                                                <span>•</span>
                                                <span>Amount: {formatCurrency(dispute.order.price, dispute.order.currency)}</span>
                                            </>
                                        )}
                                    </div>
                                    {dispute.adminResolution && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <p className="text-sm font-medium text-green-800 mb-1">Admin Resolution:</p>
                                            <p className="text-sm text-green-700">{dispute.adminResolution}</p>
                                            {dispute.resolvedAt && (
                                                <p className="text-xs text-green-600 mt-2">
                                                    Resolved on {format(new Date(dispute.resolvedAt), 'MMM d, yyyy')} by {dispute.resolvedByUser?.name || 'Admin'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                            </div>
                            <div className="flex flex-col gap-3 min-w-[180px]">
                                    {dispute.status === 'OPEN' || dispute.status === 'IN_REVIEW' ? (
                                        <>
                                            <Button 
                                                className="w-full h-12 bg-primary text-primary-foreground rounded-[1.2rem] font-normal text-sm shadow-md transition-all hover:bg-primary/90"
                                                onClick={() => router.push(`/admin/disputes/${dispute.id}`)}
                                            >
                                    Resolve Case
                                </Button>
                                            <Button 
                                                variant="outline" 
                                                className="w-full h-12 bg-background border-border text-foreground rounded-[1.2rem] font-normal text-sm hover:bg-secondary transition-all"
                                                onClick={() => router.push(`/admin/disputes/${dispute.id}`)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" /> View Details
                                            </Button>
                                            {dispute.status === 'OPEN' && (
                                                <Button 
                                                    variant="outline" 
                                                    className="w-full h-12 bg-background border-border text-foreground rounded-[1.2rem] font-normal text-sm hover:bg-secondary transition-all"
                                                    onClick={() => handleUpdateStatus(dispute.id, 'IN_REVIEW')}
                                                >
                                                    <Clock className="w-4 h-4 mr-2" /> Mark In Review
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-12 bg-background border-border text-foreground rounded-[1.2rem] font-normal text-sm hover:bg-secondary transition-all"
                                            onClick={() => handleViewDetails(dispute)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" /> View Details
                                </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Resolve Dispute Dialog */}
            <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Resolve Dispute</DialogTitle>
                        <DialogDescription>
                            Provide a resolution for this dispute. This action will be recorded.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDispute && (
                        <div className="space-y-4">
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <p className="text-sm font-medium mb-2">Dispute Details:</p>
                                <p className="text-sm text-muted-foreground mb-1"><strong>Reason:</strong> {selectedDispute.reason}</p>
                                <p className="text-sm text-muted-foreground mb-1"><strong>Description:</strong> {selectedDispute.description}</p>
                                <p className="text-sm text-muted-foreground"><strong>Order:</strong> {selectedDispute.order?.orderNumber || selectedDispute.orderId}</p>
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
                                        <SelectItem value="PAY_FREELANCER">Pay Freelancer</SelectItem>
                                        <SelectItem value="SPLIT">Split Payment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
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
