"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, AlertTriangle, ShieldCheck, Activity, Search, RefreshCw, ChevronRight, Clock } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    const handleUpdateStatus = async (e, disputeId, newStatus) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        try {
            const response = await api.patch(`/admin/disputes/${disputeId}`, { status: newStatus });
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
            <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-wider border-0 ${priorityColors[config.priority]}`}>
                {config.priority}
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
                    value={(metrics.open + metrics.inReview + metrics.resolved + metrics.closed) > 0 
                      ? `${Math.round(((metrics.resolved + metrics.closed) / (metrics.open + metrics.inReview + metrics.resolved + metrics.closed)) * 100)}%` 
                      : '100%'} 
                    trend="Trusted score" 
                    icon={<Activity />} 
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl font-normal text-foreground">Case Unit</CardTitle>
                <div className="flex flex-wrap gap-3">
                    <div className="relative w-full sm:w-64">
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
                    <Button variant="outline" size="icon" onClick={fetchDisputes} className="h-11 w-11 rounded-xl" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-56 rounded-xl" />
                    ))}
                </div>
            ) : filteredDisputes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center text-muted-foreground">
                        {disputes.length === 0 ? 'No disputes found' : 'No disputes match your filters'}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDisputes.map((dispute) => (
                        <Card key={dispute.id} className="overflow-hidden border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 flex flex-col">
                            <Link href={`/admin/disputes/${dispute.id}`} className="flex-1 flex flex-col group">
                                <CardContent className="p-4 flex flex-col flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                        {getPriorityBadge(dispute.status)}
                                        {getStatusBadge(dispute.status)}
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" /> {format(new Date(dispute.createdAt), 'dd MMM yyyy')}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-foreground line-clamp-1">{dispute.reason}</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1 min-h-10 mt-1">{dispute.description}</p>
                                    <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                                        <p>Order: {dispute.order?.orderNumber || dispute.orderId?.slice(0, 8)}</p>
                                        <p>Client: {dispute.client?.name || 'Unknown'} · Seller: {dispute.freelancer?.name || 'Unknown'}</p>
                                        {dispute.order?.price != null && (
                                            <p>Amount: {formatCurrency(dispute.order.price, dispute.order?.currency)}</p>
                                        )}
                                    </div>
                                    {dispute.adminResolution && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 line-clamp-1">Resolution added</p>
                                    )}
                                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
                                        <span className="text-sm font-medium text-primary flex items-center gap-1">
                                            Open case <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                        </span>
                                    </div>
                                </CardContent>
                            </Link>
                            {dispute.status === 'OPEN' && (
                                <div className="px-4 pb-4 pt-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full rounded-xl"
                                        onClick={(e) => handleUpdateStatus(e, dispute.id, 'IN_REVIEW')}
                                    >
                                        <Clock className="w-4 h-4 mr-2" /> Mark In Review
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
