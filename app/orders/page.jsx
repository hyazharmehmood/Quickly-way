"use client";

import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Search, Filter, Eye, MessageSquare,
    Download, CheckCircle2, Clock, AlertCircle, FileText
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

const STATUS_CONFIG = {
    PENDING_ACCEPTANCE: { label: 'PENDING', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    IN_PROGRESS: { label: 'IN PROGRESS', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    DELIVERED: { label: 'DELIVERED', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    REVISION_REQUESTED: { label: 'REVISION', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    COMPLETED: { label: 'COMPLETED', color: 'bg-green-100 text-green-600 border-green-200' },
    CANCELLED: { label: 'CANCELLED', color: 'bg-red-100 text-red-600 border-red-200' },
    DISPUTED: { label: 'DISPUTED', color: 'bg-red-200 text-red-700 border-red-300' },
};

export default function ClientOrdersPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            const params = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const response = await api.get('/orders', { params });
            console.log(">>>>", response.data);
            if (response.data.success) {
                setOrders(response.data.orders || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_ACCEPTANCE;
        return (
            <Badge variant="secondary" className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const formatDeadline = (order) => {
        if (order.status === 'COMPLETED') return 'Completed';
        if (order.status === 'CANCELLED') return 'Cancelled';
        if (!order.deliveryDate) return 'No deadline';
        
        const deliveryDate = new Date(order.deliveryDate);
        const now = new Date();
        const diff = deliveryDate - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        if (days < 0) return `Overdue by ${Math.abs(days)} days`;
        if (days === 0) return 'Due today';
        if (days === 1) return 'Due tomorrow';
        return `${days} days left`;
    };

    const handleViewOrder = (order) => {
        router.push(`/orders/${order.id}`);
    };

    const handleChat = (order) => {
        if (order.conversationId) {
            router.push(`/messages?conversationId=${order.conversationId}`);
        } else if (order.freelancerId) {
            router.push(`/messages?otherUserId=${order.freelancerId}`);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.freelancer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.service?.title?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="animate-in fade-in duration-500 space-y-4 max-w-7xl mx-auto py-6 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">My Purchases</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Track your orders and manage project delivery.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Search orders..." 
                            className="pl-10 h-11 bg-card border-border rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-11 w-32 rounded-xl border-border">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="PENDING_ACCEPTANCE">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="DELIVERED">Delivered</SelectItem>
                                <SelectItem value="REVISION_REQUESTED">Revision</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                <SelectItem value="DISPUTED">Disputed</SelectItem>
                            </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    // Skeleton Loading State
                    [...Array(3)].map((_, index) => (
                        <Card key={index} className="shadow-none transition-all overflow-hidden">
                            <div className="flex flex-col lg:flex-row">
                                <div className="p-5 md:p-8 lg:w-2/3 border-b lg:border-b-0 lg:border-r border-border">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-14 h-14 rounded-2xl" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-48" />
                                                <Skeleton className="h-4 w-64" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Skeleton className="h-20 rounded-2xl" />
                                        <Skeleton className="h-20 rounded-2xl" />
                                        <Skeleton className="h-20 rounded-2xl" />
                                    </div>
                                </div>
                                <div className="p-4 md:p-8 lg:w-1/3 bg-secondary/10 flex flex-col justify-center gap-3">
                                    <Skeleton className="h-11 w-full rounded-xl" />
                                    <Skeleton className="h-11 w-full rounded-xl" />
                                    <Skeleton className="h-11 w-full rounded-xl" />
                                </div>
                            </div>
                        </Card>
                    ))
                ) : filteredOrders.length === 0 ? (
                    <Card className=" ">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No orders found
                        </CardContent>
                    </Card>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className="shadow-none transition-all overflow-hidden">
                            <div className="flex flex-col lg:flex-row">
                                <div className="p-5 md:p-8 lg:w-2/3 border-b lg:border-b-0 lg:border-r border-border">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary">
                                                <ShoppingBag className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-normal text-foreground leading-tight">
                                                    {order.service?.title || 'Service'}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1 font-normal">
                                                    Order #{order.orderNumber} • Purchased from <span className="text-foreground font-normal">{order.freelancer?.name || 'Unknown'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-normal">Project Amount</p>
                                            <p className="text-xl font-normal text-foreground">
                                                {order.currency || 'USD'} {order.price?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-normal">Next Milestone</p>
                                            <p className="text-sm font-normal text-foreground">
                                                {order.status === 'IN_PROGRESS' ? 'Draft Review' : order.status === 'DELIVERED' ? 'Review Delivery' : 'Final Delivery'}
                                            </p>
                                        </div>
                                        <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-normal">Current Progress</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm font-normal text-foreground">{formatDeadline(order)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 md:p-8 lg:w-1/3 bg-secondary/10 flex flex-col justify-center gap-3">
                                    <Button 
                                       variant="default"
                                        className="w-full"
                                        onClick={() => handleViewOrder(order)}
                                    >
                                        <Eye className="w-4 h-4 " /> View Project Details
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full border-border"
                                        onClick={() => handleChat(order)}
                                    >
                                        <MessageSquare className="w-4 h-4 " /> Contact Freelancer
                                    </Button>
                                    {order.status === 'DELIVERED' && (
                                        <Button size="lg" variant="secondary" className="w-full bg-primary/10 text-primary border border-primary/20">
                                            <Download className="w-4 h-4 " /> Download Assets
                                        </Button>
                                    )}
                                    {(order.status === 'DELIVERED' || order.status === 'DISPUTED') && (
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-muted-foreground hover:text-destructive"
                                            onClick={() => router.push(`/orders/${order.id}`)}
                                        >
                                            <AlertCircle className="w-4 h-4 " /> {order.status === 'DISPUTED' ? 'View Dispute' : 'Report an Issue'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
