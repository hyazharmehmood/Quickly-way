"use client";

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, ShoppingBag, Clock, CheckCircle2, XCircle,
    MessageSquare, Download, Package, AlertCircle, User,
    Calendar, DollarSign, FileText, RefreshCw, Star, Edit
} from 'lucide-react';
import { ReviewModal } from '@/components/review/ReviewModal';
import DisputeThread from '@/components/dispute/DisputeThread';
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
import useAuthStore from '@/store/useAuthStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

export default function FreelancerOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeliverDialog, setShowDeliverDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [deliveryData, setDeliveryData] = useState({ type: 'MESSAGE', message: '', fileUrl: '' });
    const [cancelReason, setCancelReason] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [canReview, setCanReview] = useState({ canReview: false, reason: null });

    useEffect(() => {
        if (params.id) {
            fetchOrder();
            fetchReviews();
            checkCanReview();
        }
    }, [params.id, user?.id]);

    const fetchReviews = async () => {
        if (!params.id) return;
        try {
            const response = await api.get(`/reviews?orderId=${params.id}`);
            if (response.data.success) {
                setReviews(response.data.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const checkCanReview = async () => {
        if (!params.id || !user?.id) return;
        try {
            const response = await api.get(`/orders/${params.id}/can-review`);
            if (response.data.success) {
                setCanReview(response.data);
            }
        } catch (error) {
            console.error('Error checking review eligibility:', error);
        }
    };

    const handleReviewSubmitted = async () => {
        await fetchReviews();
        await checkCanReview();
        await fetchOrder();
    };

    const getFreelancerReview = () => {
        return reviews.find(r => r.isClientReview === false && r.reviewerId === user?.id);
    };

    const fetchOrder = async () => {
        try {
       
            const response = await api.get(`/orders/${params.id}`);
            if (response.data.success) {
                setOrder(response.data.order);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error(error.response?.data?.error || 'Failed to fetch order');
            router.push('/dashboard/freelancer/orders');
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

    const handleChat = () => {
        if (order?.conversationId) {
            router.push(`/dashboard/freelancer/messages?conversationId=${order.conversationId}`);
        } else if (order?.clientId) {
            router.push(`/dashboard/freelancer/messages?otherUserId=${order.clientId}`);
        }
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 animate-in fade-in duration-500 space-y-6">
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
                        {/* Order Overview Card Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-7 w-64" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Summary Grid Skeleton */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-5 w-12" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                </div>

                                <Separator />

                                {/* Delivery Info Skeleton */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Skeleton className="h-20 rounded-xl" />
                                    <Skeleton className="h-20 rounded-xl" />
                                </div>

                                {/* Service Description Skeleton */}
                                <Separator />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-4 w-4/6" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Deliverables Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[...Array(2)].map((_, index) => (
                                    <div key={index} className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-lg" />
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-5 w-16 rounded-full" />
                                                        <Skeleton className="h-5 w-12 rounded-full" />
                                                    </div>
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                        <Skeleton className="h-16 w-full rounded-lg" />
                                        <Skeleton className="h-9 w-32 rounded-lg mt-3" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Timeline Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5" />
                                    <Skeleton className="h-6 w-32" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0">
                                    {[...Array(3)].map((_, index) => (
                                        <div key={index}>
                                            <div className="flex items-start gap-4 py-4">
                                                <Skeleton className="h-3 w-3 rounded-full mt-1" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                            {index < 2 && <Separator className="ml-7" />}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-6">
                        {/* Order Summary Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-8" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Info Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-14 h-14 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40" />
                                        <Skeleton className="h-3 w-28" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions Skeleton */}
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <Skeleton className="h-6 w-24" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-10 w-full rounded-lg" />
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
                        <Button onClick={() => router.push('/dashboard/freelancer/orders')} className="mt-4">
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
                    onClick={() => router.push('/dashboard/freelancer/orders')}
                    className="rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-normal text-foreground tracking-tight">
                        Order Details
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {order.orderNumber || order.id.slice(0, 8)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Overview Card */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-normal mb-2">
                                    {order.service?.title || 'Service'}
                                </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Order #{order.orderNumber}
                                    </p>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Order Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Amount</Label>
                                    <p className="text-lg font-semibold text-foreground">
                                        {formatCurrency(order.price, order.currency)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Delivery Time</Label>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                        <p className="text-sm font-medium text-foreground">
                                            {order.deliveryTime || 'N/A'} days
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Revisions</Label>
                                    <p className="text-sm font-medium text-foreground">
                                        {order.revisionsUsed || 0} / {order.revisionsIncluded || 0}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Order Date</Label>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <p className="text-sm font-medium text-foreground">
                                            {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Delivery Date & Completion Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-secondary/20 rounded-xl border border-border/50">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Expected Delivery</Label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <p className="text-sm font-medium text-foreground">
                                            {order.deliveryDate 
                                                ? format(new Date(order.deliveryDate), 'MMM d, yyyy')
                                                : 'Not set'}
                                        </p>
                                    </div>
                                </div>
                                {order.completedAt && (
                                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800/50">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Completed On</Label>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            <p className="text-sm font-medium text-foreground">
                                                {format(new Date(order.completedAt), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {order.cancelledAt && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Cancelled On</Label>
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            <p className="text-sm font-medium text-foreground">
                                                {format(new Date(order.cancelledAt), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                          

                            {/* Cancellation Reason */}
                            {order.cancellationReason && (
                                <>
                                    <Separator />
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Cancellation Reason</Label>
                                        <p className="text-sm text-foreground">{order.cancellationReason}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Deliverables - Show first as it's most important */}
                    {order.deliverables && order.deliverables.length > 0 && (
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <CardTitle className="text-lg font-normal flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Deliverables ({order.deliverables.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.deliverables.map((deliverable, index) => (
                                    <div key={deliverable.id} className="p-5 bg-secondary/30 rounded-xl border border-border/50 hover:border-border transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                <Package className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                            <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-foreground">
                                                    Delivery #{order.deliverables.length - index}
                                                </span>
                                                {deliverable.isRevision && (
                                                    <Badge variant="outline" className="text-xs">
                                                                Revision {deliverable.revisionNumber || ''}
                                                    </Badge>
                                                )}
                                                        <Badge variant="secondary" className="text-xs">
                                                            {deliverable.type}
                                                        </Badge>
                                            </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                            {format(new Date(deliverable.deliveredAt), 'MMM d, yyyy h:mm a')}
                                            </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {deliverable.acceptedAt && (
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                    Accepted
                                                </Badge>
                                            )}
                                            {deliverable.rejectedAt && (
                                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                    Rejected
                                                </Badge>
                                            )}
                                        </div>
                                        {deliverable.message && (
                                            <div className="mt-3 p-3 bg-background rounded-lg border border-border/30">
                                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                                    {deliverable.message}
                                                </p>
                                            </div>
                                        )}
                                        {deliverable.fileUrl && (
                                            <div className="mt-3">
                                            <a
                                                href={deliverable.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                            >
                                                    <Download className="w-4 h-4" />
                                                Download File
                                            </a>
                                    </div>
                                        )}
                                        {deliverable.rejectionReason && (
                                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/50">
                                                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Rejection Reason:</p>
                                                <p className="text-sm text-red-600 dark:text-red-300">
                                                    {deliverable.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Disputes Section - Show when order has disputes */}
                    {order.disputes && order.disputes.length > 0 && (
                        <>
                            {order.disputes.map((dispute) => (
                                <DisputeThread 
                                    key={dispute.id} 
                                    dispute={dispute} 
                                    order={order}
                                    onCommentAdded={() => fetchOrder()}
                                />
                            ))}
                        </>
                    )}

                    {/* Reviews Section - Show for completed orders */}
                    {order.status === 'COMPLETED' && (
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <CardTitle className="text-lg font-normal">Reviews</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reviews && reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((review) => {
                                            const reviewer = review.reviewer;
                                            const isClientReview = review.isClientReview;
                                            const isMyReview = review.reviewerId === user?.id;
                                            
                                            return (
                                                <div key={review.id} className="p-6 bg-secondary/30 rounded-xl border border-border/50">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                                                                {reviewer?.profileImage ? (
                                                                    <img 
                                                                        src={reviewer.profileImage} 
                                                                        alt={reviewer.name}
                                                                        className="w-12 h-12 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="w-6 h-6 text-primary" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-normal text-foreground">
                                                                        {reviewer?.name || 'Anonymous'}
                                                                    </p>
                                                                    {isClientReview && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Client
                                                                        </Badge>
                                                                    )}
                                                                    {!isClientReview && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Freelancer
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex items-center gap-0.5">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`w-4 h-4 ${
                                                                                    i < review.rating
                                                                                        ? 'fill-yellow-400 text-yellow-400'
                                                                                        : 'text-border'
                                                                                }`}
                                                                                strokeWidth={1}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isMyReview && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setShowReviewModal(true)}
                                                                className="ml-2"
                                                            >
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {review.comment && (
                                                        <p className="text-sm text-foreground/80 leading-relaxed italic mt-4 pl-16">
                                                            "{review.comment}"
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">
                                            No reviews yet. Reviews will appear here once submitted.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Timeline - Show at bottom for historical reference */}
                    {order.events && order.events.length > 0 && (
                        <Card className="rounded-[2rem] border-none">
                            <CardHeader>
                                <CardTitle className="text-lg font-normal flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Order Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0">
                                    {order.events.map((event, index) => (
                                        <div key={event.id}>
                                            <div className="flex items-start gap-4 py-4">
                                                {/* Green dot */}
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                                </div>
                                                
                                                {/* Event content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground mb-1">
                                                        {event.description || event.eventType?.replace(/_/g, ' ') || event.type}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(event.createdAt), 'MMM d, yyyy')} {format(new Date(event.createdAt), 'HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Separator line */}
                                            {index < order.events.length - 1 && (
                                                <Separator className="ml-7" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary Stats */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    {getStatusBadge(order.status)}
                                </div>
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Total Amount</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {formatCurrency(order.price, order.currency)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Deliverables</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {order.deliverables?.length || 0}
                                    </span>
                                </div>
                                {order.disputes && order.disputes.length > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/50">
                                        <span className="text-sm text-muted-foreground">Disputes</span>
                                        <Badge variant="destructive" className="text-xs">
                                            {order.disputes.length}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Client Info */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Client
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                                    {order.client?.profileImage ? (
                                        <img 
                                            src={order.client.profileImage} 
                                            alt={order.client.name}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-7 h-7 text-primary" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground truncate">
                                        {order.client?.name || 'Unknown Client'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {order.client?.email || 'No email'}
                                    </p>
                                    {order.client?.location && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {order.client.location}
                                        </p>
                                    )}
                                    {order.client?.rating && (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-xs font-medium text-foreground">
                                                {typeof order.client.rating === 'number' ? order.client.rating.toFixed(1) : order.client.rating}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ({order.client.reviewCount || 0})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="rounded-[2rem] border-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full border-border"
                                onClick={handleChat}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" /> Open Chat
                            </Button>

                            {(order.status === 'IN_PROGRESS' || order.status === 'REVISION_REQUESTED') && (
                                <Button
                                    className="w-full bg-primary text-primary-foreground"
                                    onClick={() => setShowDeliverDialog(true)}
                                >
                                    <Package className="w-4 h-4 mr-2" /> Deliver Order
                                </Button>
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

                            {/* Review Section - Show for completed orders */}
                            {order.status === 'COMPLETED' && canReview.canReview && (
                                <>
                                    {!getFreelancerReview() && (
                                        <Button
                                            className="w-full bg-primary text-primary-foreground"
                                            onClick={() => setShowReviewModal(true)}
                                        >
                                            <Star className="w-4 h-4 mr-2" /> Review Client
                                        </Button>
                                    )}
                                    {/* Edit Review button removed - reviews cannot be edited */}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Review Modal */}
            {order && (
                <ReviewModal
                    open={showReviewModal}
                    onOpenChange={setShowReviewModal}
                    orderId={order.id}
                    revieweeId={order.clientId}
                    revieweeName={order.client?.name}
                    isClientReview={false}
                    existingReview={getFreelancerReview()}
                    onReviewSubmitted={handleReviewSubmitted}
                    allowEdit={false} // Freelancers also cannot edit reviews for now
                />
            )}

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
                                <SelectTrigger className="mt-2">
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
                                    className="mt-2"
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
                                    className="mt-2"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeliverDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeliver}>
                            Submit Delivery
                        </Button>
                    </DialogFooter>
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
        </div>
    );
}



