"use client";

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, ShoppingBag, Clock, CheckCircle2, XCircle,
    MessageSquare, Download, Package, AlertCircle, User,
    Calendar, DollarSign, FileText, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
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
import { Input } from "@/components/ui/input";
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

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeliverDialog, setShowDeliverDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showRevisionDialog, setShowRevisionDialog] = useState(false);
    const [deliveryData, setDeliveryData] = useState({ type: 'MESSAGE', message: '', fileUrl: '' });
    const [cancelReason, setCancelReason] = useState('');
    const [revisionReason, setRevisionReason] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            const response = await api.get(`/orders/${params.id}`);
            if (response.data.success) {
                setOrder(response.data.order);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error(error.response?.data?.error || 'Failed to fetch order');
            router.push('/orders');
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

    const isClient = user?.id === order?.clientId;
    const isFreelancer = user?.id === order?.freelancerId;

    const handleDeliver = async () => {
        if (!order) return;
        if (deliveryData.type === 'MESSAGE' && !deliveryData.message.trim()) {
            toast.error('Please enter a delivery message');
            return;
        }
        if (deliveryData.type === 'FILE' && !deliveryData.fileUrl.trim()) {
            toast.error('Please provide a file URL');
            return;
        }

        try {
            const response = await api.post(`/orders/${order.id}/deliver`, {
                type: deliveryData.type,
                message: deliveryData.message,
                fileUrl: deliveryData.fileUrl,
                isRevision: order.status === 'REVISION_REQUESTED',
            });
            if (response.data.success) {
                toast.success('Delivery submitted successfully');
                setShowDeliverDialog(false);
                setDeliveryData({ type: 'MESSAGE', message: '', fileUrl: '' });
                fetchOrder();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit delivery');
        }
    };

    const handleCancel = async () => {
        if (!order || !cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }

        try {
            const response = await api.post(`/orders/${order.id}/cancel`, {
                reason: cancelReason.trim(),
            });
            if (response.data.success) {
                toast.success('Order cancelled successfully');
                setShowCancelDialog(false);
                setCancelReason('');
                fetchOrder();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel order');
        }
    };

    const handleRequestRevision = async () => {
        if (!order || !revisionReason.trim()) {
            toast.error('Please provide a revision reason');
            return;
        }

        try {
            const response = await api.post(`/orders/${order.id}/revision`, {
                reason: revisionReason.trim(),
            });
            if (response.data.success) {
                toast.success('Revision requested successfully');
                setShowRevisionDialog(false);
                setRevisionReason('');
                fetchOrder();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to request revision');
        }
    };

    const handleAcceptDelivery = async () => {
        if (!order) return;

        // Get the latest deliverable
        const latestDeliverable = order.deliverables && order.deliverables.length > 0 
            ? order.deliverables[0] 
            : null;

        if (!latestDeliverable) {
            toast.error('No deliverable found to accept');
            return;
        }

        try {
            const response = await api.post(`/orders/${order.id}/complete`, {
                deliverableId: latestDeliverable.id,
            });
            if (response.data.success) {
                toast.success('Delivery accepted successfully');
                fetchOrder();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to accept delivery');
        }
    };

    const handleChat = () => {
        if (order?.conversationId) {
            const basePath = isClient ? '/messages' : '/dashboard/freelancer/messages';
            router.push(`${basePath}?conversationId=${order.conversationId}`);
        } else if (isClient && order?.freelancerId) {
            router.push(`/messages?otherUserId=${order.freelancerId}`);
        } else if (isFreelancer && order?.clientId) {
            router.push(`/dashboard/freelancer/messages?otherUserId=${order.clientId}`);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 animate-in fade-in duration-500">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <Skeleton className="h-8 w-48" />
                    </div>
                    <Card className="rounded-[2rem] border-none">
                        <CardContent className="p-8 space-y-6">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Skeleton className="h-32 rounded-xl" />
                                <Skeleton className="h-32 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
                <Card className="rounded-[2rem] border-none">
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Order not found</p>
                        <Button onClick={() => router.push('/orders')} className="mt-4">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-normal text-foreground tracking-tight">
                        Order Details
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {order.orderNumber}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Info Card */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-normal">
                                    {order.service?.title || 'Service'}
                                </CardTitle>
                                {getStatusBadge(order.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {order.service?.description && (
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Description</Label>
                                    <p className="mt-2 text-sm text-foreground">{order.service.description}</p>
                                </div>
                            )}

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Project Amount</Label>
                                    <p className="text-2xl font-normal text-foreground">
                                        {order.currency || 'USD'} {order.price?.toFixed(2) || '0.00'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Delivery Date</Label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <p className="text-sm font-normal text-foreground">
                                            {order.deliveryDate 
                                                ? format(new Date(order.deliveryDate), 'MMM d, yyyy')
                                                : 'Not set'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Revisions</Label>
                                    <p className="text-sm font-normal text-foreground">
                                        {order.revisionsUsed || 0} / {order.revisionsIncluded || 0} used
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Order Date</Label>
                                    <p className="text-sm font-normal text-foreground">
                                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deliverables */}
                    {order.deliverables && order.deliverables.length > 0 && (
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <CardTitle className="text-lg font-normal">Deliverables</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.deliverables.map((deliverable, index) => (
                                    <div key={deliverable.id} className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-normal text-foreground">
                                                    Delivery #{order.deliverables.length - index}
                                                </span>
                                                {deliverable.isRevision && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Revision
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(deliverable.deliveredAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        {deliverable.message && (
                                            <p className="text-sm text-muted-foreground mt-2">{deliverable.message}</p>
                                        )}
                                        {deliverable.fileUrl && (
                                            <a
                                                href={deliverable.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                                            >
                                                <Download className="w-3 h-3" />
                                                Download File
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* User Info */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal">
                                {isClient ? 'Freelancer' : 'Client'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center">
                                    {isClient ? (
                                        order.freelancer?.profileImage ? (
                                            <img 
                                                src={order.freelancer.profileImage} 
                                                alt={order.freelancer.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-6 h-6 text-primary" />
                                        )
                                    ) : (
                                        order.client?.profileImage ? (
                                            <img 
                                                src={order.client.profileImage} 
                                                alt={order.client.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-6 h-6 text-primary" />
                                        )
                                    )}
                                </div>
                                <div>
                                    <p className="font-normal text-foreground">
                                        {isClient ? order.freelancer?.name : order.client?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isClient ? order.freelancer?.email : order.client?.email}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="rounded-[2rem] border-none">
                        <CardContent className="p-6 space-y-3">
                            <Button
                                variant="outline"
                                className="w-full border-border"
                                onClick={handleChat}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" /> Open Chat
                            </Button>

                            {isFreelancer && (order.status === 'IN_PROGRESS' || order.status === 'REVISION_REQUESTED') && (
                                <Button
                                    className="w-full bg-primary text-primary-foreground"
                                    onClick={() => setShowDeliverDialog(true)}
                                >
                                    <Package className="w-4 h-4 mr-2" /> Deliver Order
                                </Button>
                            )}

                            {isClient && order.status === 'DELIVERED' && (
                                <>
                                    <Button
                                        className="w-full bg-primary text-primary-foreground"
                                        onClick={handleAcceptDelivery}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Accept Delivery
                                    </Button>
                                    {order.revisionsUsed < order.revisionsIncluded && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-border"
                                            onClick={() => setShowRevisionDialog(true)}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" /> Request Revision
                                        </Button>
                                    )}
                                </>
                            )}

                            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                                <Button
                                    variant="ghost"
                                    className="w-full text-destructive hover:text-destructive"
                                    onClick={() => setShowCancelDialog(true)}
                                >
                                    <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                                </Button>
                            )}

                            {order.status === 'DELIVERED' && isClient && (
                                <Button
                                    variant="secondary"
                                    className="w-full bg-primary/10 text-primary border border-primary/20"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Download Assets
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Deliver Dialog */}
            <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Delivery</DialogTitle>
                        <DialogDescription>
                            Submit your work for order {order?.orderNumber}
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
                            Please provide a reason for cancelling order {order?.orderNumber}
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

            {/* Revision Dialog */}
            <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>
                            Request a revision for order {order?.orderNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Revision Reason</Label>
                            <Textarea
                                value={revisionReason}
                                onChange={(e) => setRevisionReason(e.target.value)}
                                placeholder="What needs to be revised?"
                                rows={4}
                            />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowRevisionDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleRequestRevision} className="flex-1">
                                Request Revision
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

