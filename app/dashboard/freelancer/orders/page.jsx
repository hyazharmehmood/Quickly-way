"use client";

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Eye, MessageSquare,
    CheckCircle2, Clock, XCircle, MoreHorizontal,
    Package, RefreshCw, AlertCircle
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
import { Card, CardContent } from "@/components/ui/card";
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

export default function FreelancerOrdersPage() {
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
        router.push(`/dashboard/freelancer/orders/${order.id}`);
    };


    const handleChat = (order) => {
        if (order.conversationId) {
            router.push(`/dashboard/freelancer/messages?conversationId=${order.conversationId}`);
        } else {
            router.push(`/dashboard/freelancer/messages?otherUserId=${order.clientId}`);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.service?.title?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">Orders Management</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Track and manage your project deliveries.</p>
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
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-none shadow-none overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                        <TableHead className="px-4 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest whitespace-nowrap">Order ID</TableHead>
                                        <TableHead className="px-4 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest whitespace-nowrap">Client & Service</TableHead>
                                        <TableHead className="px-4 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center whitespace-nowrap">Deadline</TableHead>
                                        <TableHead className="px-4 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center whitespace-nowrap">Status</TableHead>
                                        <TableHead className="px-4 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right whitespace-nowrap">Revenue</TableHead>
                                        <TableHead className="px-4 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right whitespace-nowrap">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, index) => (
                                        <TableRow key={index} className="border-b border-border">
                                            <TableCell className="px-4 py-5">
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell className="px-4 py-5">
                                                <Skeleton className="h-4 w-32 mb-2" />
                                                <Skeleton className="h-3 w-24" />
                                            </TableCell>
                                                <TableCell className="px-4 py-5 text-center">
                                                <Skeleton className="h-4 w-20 mx-auto" />
                                            </TableCell>
                                            <TableCell className="px-4 py-5 text-center">
                                                <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                                            </TableCell>
                                            <TableCell className="px-4 py-5 text-right">
                                                <Skeleton className="h-4 w-16 ml-auto" />
                                            </TableCell>
                                            <TableCell className="px-4 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Skeleton className="h-9 w-9 rounded-xl" />
                                                    <Skeleton className="h-9 w-9 rounded-xl" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No orders found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                    <TableHead className="px-4 whitespace-nowrap     py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Order ID</TableHead>
                                    <TableHead className="px-4 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Client & Service</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Deadline</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Revenue</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-secondary/10 transition-colors border-b border-border group">
                                        <TableCell className="px-4 whitespace-nowrap py-5 font-normal text-muted-foreground text-sm">{order.orderNumber}</TableCell>
                                        <TableCell className="px-4 py-5">
                                            <div className="font-normal text-foreground text-sm">{order.client?.name || 'Unknown Client'}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{order.service?.title || 'Service'}</div>
                                        </TableCell>
                                        <TableCell className="px-4 whitespace-nowrap py-5 text-center">
                                            <div className="flex  items-center justify-center gap-1.5 text-xs font-normal">
                                                {order.status === 'IN_PROGRESS' || order.status === 'DELIVERED' ? (
                                                    <Clock className="w-3 h-3 text-orange-500" />
                                                ) : (
                                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                                )}
                                                <span className={order.status === 'IN_PROGRESS' || order.status === 'DELIVERED' ? 'text-orange-500' : 'text-muted-foreground'}>
                                                    {formatDeadline(order)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 whitespace-nowrap py-5 text-center">
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="px-4 whitespace-nowrap py-5 text-right font-normal text-foreground text-sm">
                                            {order.currency || 'USD'} {order.price?.toFixed(2) || '0.00'}
                                        </TableCell>
                                        <TableCell className="px-4 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl"
                                                    onClick={() => handleChat(order)}
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl border-border"
                                                    onClick={() => handleViewOrder(order)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
