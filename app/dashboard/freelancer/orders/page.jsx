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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [showDeliverDialog, setShowDeliverDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [deliveryData, setDeliveryData] = useState({ type: 'MESSAGE', message: '', fileUrl: '' });
    const [cancelReason, setCancelReason] = useState('');

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
        setSelectedOrder(order);
        setShowOrderDetail(true);
    };

    const handleDeliver = async () => {
        if (!selectedOrder) return;
        if (deliveryData.type === 'MESSAGE' && !deliveryData.message.trim()) {
            toast.error('Please enter a delivery message');
            return;
        }
        if (deliveryData.type === 'FILE' && !deliveryData.fileUrl.trim()) {
            toast.error('Please provide a file URL');
            return;
        }

        try {
            const response = await api.post(`/orders/${selectedOrder.id}/deliver`, {
                type: deliveryData.type,
                message: deliveryData.message,
                fileUrl: deliveryData.fileUrl,
                isRevision: selectedOrder.status === 'REVISION_REQUESTED',
            });
            if (response.data.success) {
                toast.success('Delivery submitted successfully');
                setShowDeliverDialog(false);
                setDeliveryData({ type: 'MESSAGE', message: '', fileUrl: '' });
                fetchOrders();
                setShowOrderDetail(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit delivery');
        }
    };

    const handleCancel = async () => {
        if (!selectedOrder || !cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }

        try {
            const response = await api.post(`/orders/${selectedOrder.id}/cancel`, {
                reason: cancelReason.trim(),
            });
            if (response.data.success) {
                toast.success('Order cancelled successfully');
                setShowCancelDialog(false);
                setCancelReason('');
                fetchOrders();
                setShowOrderDetail(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel order');
        }
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

            <Card className="border-none rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                        <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Order ID</TableHead>
                                        <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Client & Service</TableHead>
                                        <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Deadline</TableHead>
                                        <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                                        <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Revenue</TableHead>
                                        <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...Array(5)].map((_, index) => (
                                        <TableRow key={index} className="border-b border-border">
                                            <TableCell className="px-8 py-5">
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <Skeleton className="h-4 w-32 mb-2" />
                                                <Skeleton className="h-3 w-24" />
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-center">
                                                <Skeleton className="h-4 w-20 mx-auto" />
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-center">
                                                <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-right">
                                                <Skeleton className="h-4 w-16 ml-auto" />
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-right">
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
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Order ID</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Client & Service</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Deadline</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Revenue</TableHead>
                                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-secondary/10 transition-colors border-b border-border group">
                                        <TableCell className="px-8 py-5 font-normal text-muted-foreground text-sm">{order.orderNumber}</TableCell>
                                        <TableCell className="px-8 py-5">
                                            <div className="font-normal text-foreground text-sm">{order.client?.name || 'Unknown Client'}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{order.service?.title || 'Service'}</div>
                                        </TableCell>
                                        <TableCell className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-normal">
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
                                        <TableCell className="px-8 py-5 text-center">
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="px-8 py-5 text-right font-normal text-foreground text-sm">
                                            {order.currency || 'USD'} {order.price?.toFixed(2) || '0.00'}
                                        </TableCell>
                                        <TableCell className="px-8 py-5 text-right">
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

            {/* Order Detail Dialog */}
            <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            Order {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Price</Label>
                                    <div className="mt-1 font-semibold">
                                        {selectedOrder.currency || 'USD'} {selectedOrder.price?.toFixed(2) || '0.00'}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Client</Label>
                                    <div className="mt-1">{selectedOrder.client?.name || 'Unknown'}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Delivery Date</Label>
                                    <div className="mt-1">
                                        {selectedOrder.deliveryDate 
                                            ? format(new Date(selectedOrder.deliveryDate), 'd MMM, yyyy')
                                            : 'Not set'}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Service</Label>
                                    <div className="mt-1">{selectedOrder.service?.title || 'N/A'}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Revisions</Label>
                                    <div className="mt-1">
                                        {selectedOrder.revisionsUsed || 0} / {selectedOrder.revisionsIncluded || 0}
                                    </div>
                                </div>
                            </div>
                            {selectedOrder.service?.description && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Service Description</Label>
                                    <div className="mt-1 text-sm p-3 bg-secondary/50 rounded-lg">
                                        {selectedOrder.service.description}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2 pt-4">
                                {(selectedOrder.status === 'IN_PROGRESS' || selectedOrder.status === 'REVISION_REQUESTED') && (
                                    <Button 
                                        onClick={() => {
                                            setShowOrderDetail(false);
                                            setShowDeliverDialog(true);
                                        }}
                                        className="flex-1"
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        Deliver Order
                                    </Button>
                                )}
                                {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                                    <Button 
                                        variant="outline"
                                        onClick={() => {
                                            setShowOrderDetail(false);
                                            setShowCancelDialog(true);
                                        }}
                                        className="flex-1"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Cancel Order
                                    </Button>
                                )}
                                <Button 
                                    variant="secondary"
                                    onClick={() => handleChat(selectedOrder)}
                                    className="flex-1"
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Open Chat
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Deliver Dialog */}
            <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Delivery</DialogTitle>
                        <DialogDescription>
                            Submit your work for order {selectedOrder?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Delivery Type</Label>
                            <Select 
                                value={deliveryData.type} 
                                onValueChange={(value) => setDeliveryData({ ...deliveryData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MESSAGE">Message</SelectItem>
                                    <SelectItem value="FILE">File URL</SelectItem>
                                    <SelectItem value="LINK">Link</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {deliveryData.type === 'MESSAGE' && (
                            <div>
                                <Label>Delivery Message</Label>
                                <Textarea
                                    value={deliveryData.message}
                                    onChange={(e) => setDeliveryData({ ...deliveryData, message: e.target.value })}
                                    placeholder="Describe what you've delivered..."
                                    rows={4}
                                />
                            </div>
                        )}
                        {(deliveryData.type === 'FILE' || deliveryData.type === 'LINK') && (
                            <div>
                                <Label>{deliveryData.type === 'FILE' ? 'File URL' : 'Link'}</Label>
                                <Input
                                    value={deliveryData.fileUrl}
                                    onChange={(e) => setDeliveryData({ ...deliveryData, fileUrl: e.target.value })}
                                    placeholder={deliveryData.type === 'FILE' ? 'https://...' : 'https://...'}
                                />
                            </div>
                        )}
                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowDeliverDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleDeliver} className="flex-1">
                                Submit Delivery
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for cancelling order {selectedOrder?.orderNumber}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            rows={4}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel}>Confirm Cancellation</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
