"use client";

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Clock, CheckCircle2, XCircle,
    MessageSquare, Download, Package, AlertCircle, User,
    Calendar, RefreshCw, Star, CreditCard
} from 'lucide-react';
import { ReviewModal } from '@/components/review/ReviewModal';
import DisputeThread from '@/components/dispute/DisputeThread';
import {
    OrderDetailSkeleton,
    OrderStatusBadge,
    DeliverDialog,
    CancelOrderDialog,
    RevisionDialog,
    DisputeDialog,
} from '@/components/order';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeliverDialog, setShowDeliverDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showRevisionDialog, setShowRevisionDialog] = useState(false);
    const [showDisputeDialog, setShowDisputeDialog] = useState(false);
    const [showCompleteOrderDialog, setShowCompleteOrderDialog] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [completingOrder, setCompletingOrder] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [canReview, setCanReview] = useState({ canReview: false, reason: null });

    // Calculate user role early
    const isClient = user?.id === order?.clientId;
    const isFreelancer = user?.id === order?.freelancerId;

    useEffect(() => {
        if (params.id) {
            fetchOrder();
            fetchReviews();
            checkCanReview();
        }
    }, [params.id, user?.id]);

    useEffect(() => {
        // Show review modal when order is completed and user is client
        if (order?.status === 'COMPLETED' && isClient && !showReviewModal) {
            // Check if client has already reviewed
            const clientReview = reviews.find(r => r.isClientReview === true && r.reviewerId === user?.id);
            if (!clientReview) {
                // Show popup after a short delay
                const timer = setTimeout(() => {
                    setShowReviewModal(true);
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [order?.status, isClient, reviews, user?.id, showReviewModal]);

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

    const handleDeliver = async (payload) => {
        if (!order) return {};
        try {
            const response = await api.post(`/orders/${order.id}/deliver`, payload);
            if (response.data.success) {
                toast.success('Delivery submitted successfully');
                await fetchOrder();
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to submit delivery');
        }
        return {};
    };

    const handleCancel = async (reason) => {
        if (!order) return {};
        try {
            const response = await api.post(`/orders/${order.id}/cancel`, { reason });
            if (response.data.success) {
                toast.success('Order cancelled successfully');
                await fetchOrder();
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to cancel order');
        }
        return {};
    };

    const handleRequestRevision = async (reason) => {
        if (!order) return {};
        try {
            const response = await api.post(`/orders/${order.id}/revision`, { reason });
            if (response.data.success) {
                toast.success('Revision requested successfully');
                await fetchOrder();
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to request revision');
        }
        return {};
    };

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

    const servicePaymentMethods = order?.service?.paymentMethods && Array.isArray(order.service.paymentMethods)
        ? order.service.paymentMethods
        : [];
    const requiresPaymentSelection = servicePaymentMethods.length > 0;

    const handleAcceptDeliveryClick = () => {
        if (!order) return;
        if (requiresPaymentSelection) {
            setSelectedPaymentMethod(order.paymentMethodUsed || '');
            setShowCompleteOrderDialog(true);
            return;
        }
        handleAcceptDelivery();
    };

    const handleAcceptDelivery = async (paymentMethodUsedParam) => {
        if (!order) return;

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
                ...(paymentMethodUsedParam && { paymentMethodUsed: paymentMethodUsedParam }),
            });
            if (response.data.success) {
                toast.success('Order completed successfully!');
                setShowCompleteOrderDialog(false);
                setSelectedPaymentMethod('');
                await fetchOrder();
                await fetchReviews();
                await checkCanReview();
                if (isClient) {
                    setTimeout(() => setShowReviewModal(true), 500);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to accept delivery');
        }
    };

    const handleCompleteOrderWithPayment = async () => {
        if (!selectedPaymentMethod) {
            toast.error('Please select a payment method');
            return;
        }
        setCompletingOrder(true);
        try {
            await handleAcceptDelivery(selectedPaymentMethod);
        } finally {
            setCompletingOrder(false);
        }
    };

    const handleReviewSubmitted = async () => {
        await fetchReviews();
        await checkCanReview();
        await fetchOrder();
    };

    const getClientReview = () => {
        return reviews.find(r => r.isClientReview === true && r.reviewerId === user?.id);
    };

    const getFreelancerReview = () => {
        return reviews.find(r => r.isClientReview === false && r.reviewerId === user?.id);
    };

    const handleOpenDispute = async ({ reason, description, attachments: files }) => {
        if (!order) return {};
        try {
            let attachments = null;
            if (files?.length > 0) {
                const { uploadToCloudinary } = await import('@/utils/cloudinary');
                attachments = await Promise.all(
                    files.map(async (file) => ({
                        url: await uploadToCloudinary(file),
                        name: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                    }))
                );
            }
            const response = await api.post(`/orders/${order.id}/dispute`, {
                reason,
                description,
                attachments,
            });
            if (response.data.success) {
                toast.success('Dispute opened. Use the dispute thread to communicate.');
                await fetchOrder();
                return response.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to open dispute');
        }
        return {};
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

    if (loading) return <OrderDetailSkeleton />;

    if (!order) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
                <Card className="border shadow-none">
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
        <div className="max-w-7xl mx-auto  animate-in fade-in duration-500 space-y-6 py-4">
            {/* <div className="flex items-center gap-4">
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
            </div> */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Overview Card */}
                    <Card className="border shadow-none">
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
                                <OrderStatusBadge status={order.status} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Order Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">Amount</Label>
                                    <p className="text-lg font-semibold text-foreground">
                                        {order.currency || 'USD'} {order.price?.toFixed(2) || '0.00'}
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
                                {order.paymentMethodUsed && (
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-widest">Payment method</Label>
                                        <p className="text-sm font-medium text-foreground">{order.paymentMethodUsed}</p>
                                    </div>
                                )}
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

                           
                        </CardContent>
                    </Card>

                    {/* Deliverables - Show first as it's most important */}
                    {order.deliverables && order.deliverables.length > 0 && (
                        <Card className="border shadow-none">
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

                    {/* Disputes Section - Show early if there are disputes */}
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
                        <Card className="border shadow-none">
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
                                                        <div className="flex items-center gap-4">
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
                                                            <div>
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
                                                    </div>
                                                    {review.comment && (
                                                        <p className="text-sm text-foreground/80 leading-relaxed italic mt-4 pl-16">
                                                            "{review.comment}"
                                                        </p>
                                                    )}
                                                    {/* Edit Review button removed for clients - reviews cannot be edited */}
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
                            <Card className="border shadow-none">
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
                                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                                </div>
                                                
                                                {/* Event content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground mb-1">
                                                        {event.description || event.eventType.replace(/_/g, ' ')}
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
                    <Card className="border shadow-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-sm text-muted-foreground">Total Amount</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {order.currency || 'USD'} {order.price?.toFixed(2) || '0.00'}
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
                    <Card className="border shadow-none">
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
                                        {order.client?.name || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {order.client?.email}
                                    </p>
                                    {order.client?.location && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {order.client.location}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Freelancer Info */}
                    <Card className="border shadow-none">
                        <CardHeader>
                            <CardTitle className="text-lg font-normal flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Freelancer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                                    {order.freelancer?.profileImage ? (
                                        <img 
                                            src={order.freelancer.profileImage} 
                                            alt={order.freelancer.name}
                                            className="w-14 h-14 rounded-full object-cover"
                                            />
                                        ) : (
                                        <User className="w-7 h-7 text-primary" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground truncate">
                                        {order.freelancer?.name || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {order.freelancer?.email}
                                    </p>
                                    {order.freelancer?.location && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {order.freelancer.location}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="border shadow-none">
                        <CardContent className="p-6 space-y-3">
                            <Button
                                variant="outline"
                                className="w-full border-border"
                                onClick={handleChat}
                            >
                                <MessageSquare className="w-4 h-4 " /> Open Chat
                            </Button>

                            {isFreelancer && (order.status === 'IN_PROGRESS' || order.status === 'REVISION_REQUESTED') && (
                                <Button
                                    className="w-full bg-primary text-primary-foreground"
                                    onClick={() => setShowDeliverDialog(true)}
                                >
                                    <Package className="w-4 h-4 " /> Deliver Order
                                </Button>
                            )}

                            {/* Fiverr Workflow: DELIVERED status actions */}
                            {order.status === 'DELIVERED' && (
                                <>
                                    {isClient && (
                                        <>
                                            <Button
                                                className="w-full bg-primary text-primary-foreground"
                                                onClick={handleAcceptDeliveryClick}
                                            >
                                                <CheckCircle2 className="w-4 h-4 " /> Accept & Complete
                                            </Button>
                                            {order.revisionsUsed < order.revisionsIncluded && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-border"
                                                    onClick={() => setShowRevisionDialog(true)}
                                                >
                                                    <RefreshCw className="w-4 h-4 " /> Request Revision
                                                </Button>
                                            )}
                                            {/* Only show dispute button if no active dispute exists */}
                                            {(!order.disputes || order.disputes.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length === 0) && (
                                            <Button
                                                variant="outline"
                                                className="w-full border-destructive text-destructive hover:bg-destructive/10"
                                                onClick={() => setShowDisputeDialog(true)}
                                            >
                                                <AlertCircle className="w-4 h-4 " /> Open Dispute
                                            </Button>
                                            )}
                                        </>
                                    )}
                                    {isFreelancer && (
                                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                            <p className="text-sm text-muted-foreground text-center">
                                                Waiting for client response
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Show dispute button for DISPUTED status if client hasn't opened one yet */}
                            {order.status === 'DISPUTED' && isClient && (
                                <>
                                    {(!order.disputes || order.disputes.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length === 0) && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-destructive text-destructive hover:bg-destructive/10"
                                            onClick={() => setShowDisputeDialog(true)}
                                        >
                                            <AlertCircle className="w-4 h-4 " /> Open Dispute
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* Fiverr Workflow: Cancellation allowed only before delivery */}
                            {(order.status === 'PENDING_ACCEPTANCE' || order.status === 'IN_PROGRESS') && (
                                <Button
                                    variant="ghost"
                                    className="w-full text-destructive hover:text-destructive"
                                    onClick={() => setShowCancelDialog(true)}
                                >
                                    <XCircle className="w-4 h-4 " /> Cancel Order
                                </Button>
                            )}

                            {/* Fiverr Workflow: REVISION_REQUESTED - Client cannot cancel */}
                            {order.status === 'REVISION_REQUESTED' && isFreelancer && (
                                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                    <p className="text-sm text-muted-foreground text-center mb-3">
                                        Client requested a revision
                                    </p>
                                    <Button
                                        className="w-full bg-primary text-primary-foreground"
                                        onClick={() => setShowDeliverDialog(true)}
                                    >
                                        <Package className="w-4 h-4 " /> Re-deliver
                                    </Button>
                                </div>
                            )}

                            {order.status === 'DELIVERED' && isClient && (
                                <Button
                                    variant="secondary"
                                    className="w-full bg-primary/10 text-primary border border-primary/20"
                                >
                                    <Download className="w-4 h-4 " /> Download Assets
                                </Button>
                            )}

                            {/* Review Section - Show for completed orders */}
                            {order.status === 'COMPLETED' && (
                                <>
                                    {isClient && (
                                        <>
                                            {!getClientReview() && (
                                                <Button
                                                    className="w-full bg-primary text-primary-foreground"
                                                    onClick={() => setShowReviewModal(true)}
                                                >
                                                    <Star className="w-4 h-4 " /> Create Review
                                                </Button>
                                            )}
                                            {/* Edit Review button removed for clients - reviews cannot be edited */}
                                        </>
                                    )}
                                    {isFreelancer && canReview.canReview && (
                                        <>
                                            {!getFreelancerReview() && (
                                                <Button
                                                    className="w-full bg-primary text-primary-foreground"
                                                    onClick={() => setShowReviewModal(true)}
                                                >
                                                    <Star className="w-4 h-4 " /> Review Client
                                                </Button>
                                            )}
                                            {/* Edit Review button removed - reviews cannot be edited */}
                                        </>
                                    )}
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
                    revieweeId={isClient ? order.freelancerId : order.clientId}
                    revieweeName={isClient ? order.freelancer?.name : order.client?.name}
                    isClientReview={isClient}
                    existingReview={isClient ? getClientReview() : getFreelancerReview()}
                    onReviewSubmitted={handleReviewSubmitted}
                    allowEdit={!isClient} // Clients cannot edit reviews, freelancers can (if needed in future)
                />
            )}

            <DeliverDialog
                open={showDeliverDialog}
                onOpenChange={setShowDeliverDialog}
                order={order}
                onSuccess={handleDeliver}
            />
            <CancelOrderDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                order={order}
                onConfirm={handleCancel}
            />
            <RevisionDialog
                open={showRevisionDialog}
                onOpenChange={setShowRevisionDialog}
                order={order}
                onConfirm={handleRequestRevision}
            />
            <DisputeDialog
                open={showDisputeDialog}
                onOpenChange={setShowDisputeDialog}
                order={order}
                onSubmit={handleOpenDispute}
            />

            {/* Complete order: select payment method when required */}
            <Dialog open={showCompleteOrderDialog} onOpenChange={setShowCompleteOrderDialog}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-normal">
                            <CreditCard className="w-5 h-5" />
                            Select payment method
                        </DialogTitle>
                        <DialogDescription>
                            Choose how you paid for this order. The order will be marked complete after you confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Payment method</Label>
                            <Select
                                value={selectedPaymentMethod}
                                onValueChange={(value) => setSelectedPaymentMethod(value)}
                                className="w-full"
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {servicePaymentMethods.map((method) => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowCompleteOrderDialog(false)}
                                disabled={completingOrder}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 bg-primary text-primary-foreground"
                                onClick={handleCompleteOrderWithPayment}
                                disabled={!selectedPaymentMethod || completingOrder}
                            >
                                {completingOrder ? 'Completing...' : 'Complete order'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

