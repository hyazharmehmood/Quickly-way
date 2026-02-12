"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, FileCheck, Clock, XCircle, Eye, Edit3, TrendingUp, Package, ShoppingCart, Search, RefreshCw } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from '@/utils/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

const STATUS_CONFIG = {
    PENDING_ACCEPTANCE: { label: 'PENDING', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    IN_PROGRESS: { label: 'IN PROGRESS', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    DELIVERED: { label: 'DELIVERED', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    REVISION_REQUESTED: { label: 'REVISION', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    COMPLETED: { label: 'COMPLETED', color: 'bg-green-100 text-green-600 border-green-200' },
    CANCELLED: { label: 'CANCELLED', color: 'bg-red-100 text-red-600 border-red-200' },
    DISPUTED: { label: 'DISPUTED', color: 'bg-red-200 text-red-700 border-red-300' },
};

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeOrders: 0,
        totalPayout: 0,
        delivered: 0,
    });

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    useEffect(() => {
        calculateMetrics();
    }, [orders]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
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

    const calculateMetrics = () => {
        if (orders.length === 0) {
            setMetrics({
                totalRevenue: 0,
                activeOrders: 0,
                totalPayout: 0,
                delivered: 0,
            });
            return;
        }

        const totalRevenue = orders.reduce((sum, order) => {
            if (order.status === 'COMPLETED') {
                return sum + (order.price || 0);
            }
            return sum;
        }, 0);

        const activeOrders = orders.filter(order => 
            ['PENDING_ACCEPTANCE', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'].includes(order.status)
        ).length;

        const totalPayout = orders.reduce((sum, order) => {
            if (order.status === 'COMPLETED') {
                return sum + (order.price || 0);
            }
            return sum;
        }, 0);

        const delivered = orders.filter(order => 
            order.status === 'COMPLETED'
        ).length;

        setMetrics({
            totalRevenue,
            activeOrders,
            totalPayout,
            delivered,
        });
    };

    const getStatusBadge = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_ACCEPTANCE;
        return (
            <Badge variant="secondary" className={`px-4 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${config.color}`}>
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
        router.push(`/admin/orders/${order.id}`);
    };

    const filteredOrders = orders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
        }
        
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
            order.orderNumber?.toLowerCase().includes(query) ||
            order.client?.name?.toLowerCase().includes(query) ||
            order.freelancer?.name?.toLowerCase().includes(query) ||
            order.service?.title?.toLowerCase().includes(query) ||
            order.id?.toLowerCase().includes(query)
        );
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount || 0);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Market Vol." 
                    value={formatCurrency(metrics.totalRevenue)} 
                    trend="Total revenue" 
                    icon={<TrendingUp />} 
                />
                <MetricCard 
                    title="Active Orders" 
                    value={metrics.activeOrders.toString()} 
                    trend="In progress" 
                    icon={<ShoppingCart />} 
                />
                <MetricCard 
                    title="Total Payout" 
                    value={formatCurrency(metrics.totalPayout)} 
                    trend="Completed orders" 
                    icon={<DollarSign />} 
                />
                <MetricCard 
                    title="Delivered" 
                    value={metrics.delivered.toString()} 
                    trend="Verified" 
                    icon={<Package />} 
                />
            </div>

            <Card className="border-none shadow-none">
                <CardHeader className="px-0 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <CardTitle className="text-xl font-normal text-foreground">Job Ledger</CardTitle>
                        <p className="text-muted-foreground font-normal mt-0.5 text-sm">All orders across the platform</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Search orders..." 
                                className="pl-10 "
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-11 w-40 ">
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
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchOrders}
                            className="h-11 w-11 "
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                            <div className="px-2">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                        <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Job ID</TableHead>
                                        <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Client / Assignment</TableHead>
                                        <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Freelancer</TableHead>
                                        <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Value</TableHead>
                                        <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Stage</TableHead>
                                        <TableHead className="px-4 whitespace-nowrap py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, index) => (
                                        <TableRow key={index} className="border-b border-border">
                                            <TableCell className="px-4 py-6">
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell className="px-4 py-6">
                                                <Skeleton className="h-4 w-32 mb-2" />
                                                <Skeleton className="h-3 w-24" />
                                            </TableCell>
                                            <TableCell className="px-4 py-6">
                                                <Skeleton className="h-4 w-28" />
                                            </TableCell>
                                            <TableCell className="px-4 py-6">
                                                <Skeleton className="h-4 w-20" />
                                            </TableCell>
                                            <TableCell className="px-4 py-6">
                                                <Skeleton className="h-6 w-24 rounded-full" />
                                            </TableCell>
                                            <TableCell className="px-4 py-6 text-right">
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
                        <div className="p-8 text-center text-muted-foreground">
                            {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                    <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Job ID</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Client / Assignment</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Freelancer</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Value</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Stage</TableHead>
                                    <TableHead className="px-4 whitespace-nowrap py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-secondary/20 transition-colors group border-b border-border">
                                        <TableCell className="px-4 whitespace-nowrap py-6 font-normal text-foreground text-base tracking-tighter">
                                            {order.orderNumber || order.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell className="px-4 whitespace-nowrap    py-6">
                                            <div className="font-normal text-foreground text-base leading-tight">
                                                {order.client?.name || 'Unknown Client'}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-normal mt-1">
                                                {order.service?.title || 'No service title'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 whitespace-nowrap py-6">
                                            <div className="font-normal text-foreground text-sm">
                                                {order.freelancer?.name || 'Unknown Freelancer'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-6 whitespace-nowrap font-normal text-foreground text-base">
                                            {formatCurrency(order.price)}
                                        </TableCell>
                                        <TableCell className="px-4 whitespace-nowrap py-6">
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="px-4 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-9 w-9 rounded-xl"
                                                    onClick={() => handleViewOrder(order)}
                                                >
                                                    <Eye className="w-4 h-4 text-muted-foreground" />
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
