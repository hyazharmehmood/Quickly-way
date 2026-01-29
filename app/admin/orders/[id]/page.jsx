"use client";

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, ShoppingBag, Clock, CheckCircle2, XCircle,
    MessageSquare, Download, Package, AlertCircle, User,
    Calendar, DollarSign, FileText, RefreshCw, Mail, Phone
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const STATUS_CONFIG = {
    PENDING_ACCEPTANCE: { label: 'PENDING', color: 'bg-orange-100 text-orange-600 border-orange-200' },
    IN_PROGRESS: { label: 'IN PROGRESS', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    DELIVERED: { label: 'DELIVERED', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    REVISION_REQUESTED: { label: 'REVISION', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    COMPLETED: { label: 'COMPLETED', color: 'bg-green-100 text-green-600 border-green-200' },
    CANCELLED: { label: 'CANCELLED', color: 'bg-red-100 text-red-600 border-red-200' },
    DISPUTED: { label: 'DISPUTED', color: 'bg-red-200 text-red-700 border-red-300' },
};

export default function AdminOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/${params.id}`);
            if (response.data.success) {
                setOrder(response.data.order);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error(error.response?.data?.error || 'Failed to fetch order');
            router.push('/admin/orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_ACCEPTANCE;
        return (
            <Badge variant="secondary" className={`px-4 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${config.color}`}>
                {config.label}
            </Badge>
        );
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto animate-in fade-in duration-500 space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Skeleton */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Info Card Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-8 w-32" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-5 w-28" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Deliverables Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[...Array(2)].map((_, index) => (
                                    <div key={index} className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-4 w-full mt-2" />
                                        <Skeleton className="h-4 w-3/4 mt-2" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Order History Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, index) => (
                                        <div key={index} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                                            <Skeleton className="w-2 h-2 rounded-full mt-2 flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-6">
                        {/* Client Info Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Freelancer Info Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service Info Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-40" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[...Array(4)].map((_, index) => (
                                        <Skeleton key={index} className="w-full h-20 rounded-lg" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-10 w-full rounded-lg" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </CardContent>
                        </Card>
                    </div>
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
                        <Button onClick={() => router.push('/admin/orders')} className="mt-4">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container  animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/admin/orders')}
                    className="rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-normal text-foreground tracking-tight">
                        Order Details
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {order.orderNumber || order.id.slice(0, 8)}
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
                                        {formatCurrency(order.price, order.currency)}
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
                                        {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
                                    </p>
                                </div>
                                {order.completedAt && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest">Completed At</Label>
                                        <p className="text-sm font-normal text-foreground">
                                            {format(new Date(order.completedAt), 'MMM d, yyyy HH:mm')}
                                        </p>
                                    </div>
                                )}
                                {order.cancelledAt && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest">Cancelled At</Label>
                                        <p className="text-sm font-normal text-foreground">
                                            {format(new Date(order.cancelledAt), 'MMM d, yyyy HH:mm')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {order.cancellationReason && (
                                <>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest">Cancellation Reason</Label>
                                        <p className="mt-2 text-sm text-foreground">{order.cancellationReason}</p>
                                    </div>
                                </>
                            )}
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
                                                {format(new Date(deliverable.deliveredAt), 'MMM d, yyyy HH:mm')}
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

                    {/* Order Events/History */}
                    {order.events && order.events.length > 0 && (
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <CardTitle className="text-lg font-normal">Order History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.events.map((event, index) => (
                                        <div key={event.id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-normal text-foreground">{event.description || event.type}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {format(new Date(event.createdAt), 'MMM d, yyyy HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Disputes */}
                    {order.disputes && order.disputes.length > 0 && (
                        <Card className="rounded-[2rem] border-none border-red-200">
                            <CardHeader>
                                <CardTitle className="text-lg font-normal text-destructive flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Active Disputes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.disputes.map((dispute) => (
                                    <div key={dispute.id} className="p-4 bg-red-50/50 rounded-xl border border-red-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="destructive" className="text-xs">
                                                {dispute.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        {dispute.reason && (
                                            <p className="text-sm text-foreground mt-2">{dispute.reason}</p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Client Info */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal">Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center">
                                    {order.client?.profileImage ? (
                                        <img 
                                            src={order.client.profileImage} 
                                            alt={order.client.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-6 h-6 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-normal text-foreground">
                                        {order.client?.name || 'Unknown Client'}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Mail className="w-3 h-3" />
                                        {order.client?.email || 'No email'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Freelancer Info */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal">Freelancer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center">
                                    {order.freelancer?.profileImage ? (
                                        <img 
                                            src={order.freelancer.profileImage} 
                                            alt={order.freelancer.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-6 h-6 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-normal text-foreground">
                                        {order.freelancer?.name || 'Unknown Freelancer'}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                        <Mail className="w-3 h-3" />
                                        {order.freelancer?.email || 'No email'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Info */}
                    {order.service && (
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <CardTitle className="text-lg font-normal">Service Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="font-normal text-foreground text-sm mb-2">
                                        {order.service.title}
                                    </p>
                                    {order.service.freelancer && (
                                        <p className="text-xs text-muted-foreground">
                                            By {order.service.freelancer.name}
                                        </p>
                                    )}
                                </div>
                                {order.service.images && order.service.images.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {order.service.images.slice(0, 4).map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Service ${index + 1}`}
                                                className="w-full h-20 object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* {order.conversationId && (
                                <Button
                                    variant="outline"
                                    className="w-full border-border"
                                    onClick={() => router.push(`/admin/messages?conversationId=${order.conversationId}`)}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" /> View Conversation
                                </Button>
                            )} */}
                            <Button
                                variant="outline"
                                className="w-full border-border"
                                onClick={() => router.push(`/admin/orders`)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

