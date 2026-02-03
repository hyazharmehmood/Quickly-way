"use client";

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Flag, Trash2, TrendingUp, MessageSquare, CheckCircle2, Search, RefreshCw, Eye, XCircle, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        total: 0,
        approved: 0,
        flagged: 0,
        pending: 0,
        averageRating: 0,
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReview, setSelectedReview] = useState(null);
    const [flagDialogOpen, setFlagDialogOpen] = useState(false);
    const [flagReason, setFlagReason] = useState('');
    const [flagging, setFlagging] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [statusFilter, ratingFilter]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            if (ratingFilter !== 'all') {
                params.rating = ratingFilter;
            }
            const response = await api.get('/admin/reviews', { params });
            if (response.data.success) {
                setReviews(response.data.reviews || []);
                setMetrics(response.data.metrics || {
                    total: 0,
                    approved: 0,
                    flagged: 0,
                    pending: 0,
                    averageRating: 0,
                });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId) => {
        try {
            const response = await api.patch(`/admin/reviews/${reviewId}`, {
                action: 'approve',
            });

            if (response.data.success) {
                toast.success('Review approved successfully');
                fetchReviews();
            }
        } catch (error) {
            console.error('Error approving review:', error);
            toast.error(error.response?.data?.error || 'Failed to approve review');
        }
    };

    const handleFlag = async () => {
        if (!flagReason.trim()) {
            toast.error('Please provide a reason for flagging');
            return;
        }

        try {
            setFlagging(true);
            const response = await api.patch(`/admin/reviews/${selectedReview.id}`, {
                action: 'flag',
                flaggedReason: flagReason,
            });

            if (response.data.success) {
                toast.success('Review flagged successfully');
                setFlagDialogOpen(false);
                setFlagReason('');
                setSelectedReview(null);
                fetchReviews();
            }
        } catch (error) {
            console.error('Error flagging review:', error);
            toast.error(error.response?.data?.error || 'Failed to flag review');
        } finally {
            setFlagging(false);
        }
    };

    const handleUnflag = async (reviewId) => {
        try {
            const response = await api.patch(`/admin/reviews/${reviewId}`, {
                action: 'unflag',
            });

            if (response.data.success) {
                toast.success('Review unflagged successfully');
                fetchReviews();
            }
        } catch (error) {
            console.error('Error unflagging review:', error);
            toast.error(error.response?.data?.error || 'Failed to unflag review');
        }
    };

    const handleFeature = async (reviewId, isFeatured) => {
        try {
            const response = await api.patch(`/admin/reviews/${reviewId}`, {
                action: isFeatured ? 'unfeature' : 'feature',
            });

            if (response.data.success) {
                toast.success(`Review ${isFeatured ? 'unfeatured' : 'featured'} successfully`);
                fetchReviews();
            }
        } catch (error) {
            console.error('Error featuring review:', error);
            toast.error(error.response?.data?.error || 'Failed to update review');
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const response = await api.delete(`/admin/reviews/${selectedReview.id}`);

            if (response.data.success) {
                toast.success('Review deleted successfully');
                setDeleteDialogOpen(false);
                setSelectedReview(null);
                fetchReviews();
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error(error.response?.data?.error || 'Failed to delete review');
        } finally {
            setDeleting(false);
        }
    };

    const filteredReviews = reviews.filter(review => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            review.comment?.toLowerCase().includes(query) ||
            review.reviewer?.name?.toLowerCase().includes(query) ||
            review.reviewee?.name?.toLowerCase().includes(query) ||
            review.order?.orderNumber?.toLowerCase().includes(query) ||
            review.service?.title?.toLowerCase().includes(query)
        );
    });

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const now = new Date();
        const reviewDate = new Date(date);
        const diffInHours = Math.floor((now - reviewDate) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInHours < 48) return 'Yesterday';
        return format(reviewDate, 'MMM d, yyyy');
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Avg Rating" 
                    value={metrics.averageRating.toFixed(1)} 
                    trend="+0.2 higher" 
                    icon={<TrendingUp />} 
                />
                <MetricCard 
                    title="Moderated" 
                    value={metrics.approved.toString()} 
                    trend="Approved reviews" 
                    icon={<CheckCircle2 />} 
                />
                <MetricCard 
                    title="Flagged" 
                    value={metrics.flagged.toString()} 
                    trend="Review queue" 
                    icon={<Flag className="text-destructive" />} 
                />
                <MetricCard 
                    title="New Feed" 
                    value={metrics.pending.toString()} 
                    trend="Pending approval" 
                    icon={<MessageSquare />} 
                />
            </div>

            <Card className="border-none rounded-[2rem]">
                <CardHeader className="p-10 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6">
                    <CardTitle className="text-xl font-normal text-foreground">Feedback Hub</CardTitle>
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Search reviews..." 
                                className="pl-10 h-11 bg-card border-border rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-11 w-40 rounded-xl border-border">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="flagged">Flagged</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                            <SelectTrigger className="h-11 w-40 rounded-xl border-border">
                                <SelectValue placeholder="Rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Ratings</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                                <SelectItem value="4">4 Stars</SelectItem>
                                <SelectItem value="3">3 Stars</SelectItem>
                                <SelectItem value="2">2 Stars</SelectItem>
                                <SelectItem value="1">1 Star</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchReviews}
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
                                <div key={i} className="flex items-start gap-5">
                                    <Skeleton className="w-14 h-14 rounded-[1.2rem]" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground">
                            {reviews.length === 0 ? 'No reviews found' : 'No reviews match your filters'}
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                        <div key={review.id} className="p-10 hover:bg-secondary/20 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-5">
                                        <img 
                                            src={review.reviewer?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.reviewer?.name || 'User')} 
                                            alt="" 
                                            className="w-14 h-14 rounded-[1.2rem] object-cover shadow-md border-2 border-background" 
                                        />
                                    <div>
                                            <h4 className="text-lg font-normal text-foreground">{review.reviewer?.name || 'Unknown User'}</h4>
                                            <p className="text-xs text-muted-foreground font-normal uppercase tracking-widest mt-0.5">
                                                {formatDate(review.createdAt)}
                                                {review.isOrderReview && review.order && ` • Order: ${review.order.orderNumber || review.order.id.slice(0, 8)}`}
                                                {!review.isOrderReview && review.service && ` • Service: ${review.service.title}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Reviewing: {review.reviewee?.name || 'Unknown'}
                                                {review.isClientReview ? ' (Client → Freelancer)' : ' (Freelancer → Client)'}
                                            </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <div className="flex items-center gap-1 bg-secondary/50 px-3 py-1.5 rounded-xl shadow-inner">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-border'}`} strokeWidth={1} />
                                        ))}
                                    </div>
                                        <div className="flex gap-2">
                                            {review.isApproved && !review.isFlagged && (
                                                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-green-100 text-green-600 border-green-200">
                                                    Approved
                                                </Badge>
                                            )}
                                            {review.isFlagged && (
                                                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-red-100 text-red-600 border-red-200">
                                                    Flagged
                                                </Badge>
                                            )}
                                            {!review.isApproved && !review.isFlagged && (
                                                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-yellow-100 text-yellow-600 border-yellow-200">
                                                    Pending
                                                </Badge>
                                            )}
                                            {review.isFeatured && (
                                                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-600 border-blue-200">
                                                    Featured
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-lg text-foreground/80 leading-relaxed italic mb-8 font-normal px-1">"{review.comment || 'No comment provided'}"</p>
                                {review.isFlagged && review.flaggedReason && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <p className="text-sm font-medium text-red-800 mb-1">Flagged Reason:</p>
                                        <p className="text-sm text-red-700">{review.flaggedReason}</p>
                                        {review.flaggedAt && (
                                            <p className="text-xs text-red-600 mt-2">
                                                Flagged on {format(new Date(review.flaggedAt), 'MMM d, yyyy')} by {review.flaggedByUser?.name || 'Admin'}
                                            </p>
                                        )}
                            </div>
                                )}
                            <div className="flex items-center justify-between">
                                    <div className="flex gap-3 flex-wrap">
                                        {!review.isApproved && !review.isFlagged && (
                                            <Button 
                                                variant="secondary" 
                                                className="h-10 px-6 bg-green-100 text-green-700 rounded-xl text-[10px] font-normal uppercase border border-green-200 flex items-center gap-2 hover:bg-green-200 transition-all"
                                                onClick={() => handleApprove(review.id)}
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Approve
                                            </Button>
                                        )}
                                        {review.isFlagged && (
                                            <Button 
                                                variant="secondary" 
                                                className="h-10 px-6 bg-green-100 text-green-700 rounded-xl text-[10px] font-normal uppercase border border-green-200 flex items-center gap-2 hover:bg-green-200 transition-all"
                                                onClick={() => handleUnflag(review.id)}
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Unflag
                                    </Button>
                                        )}
                                        {!review.isFlagged && (
                                            <Button 
                                                variant="outline" 
                                                className="h-10 px-6 bg-secondary/50 text-muted-foreground rounded-xl text-[10px] font-normal uppercase border border-border flex items-center gap-2 transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                                onClick={() => {
                                                    setSelectedReview(review);
                                                    setFlagDialogOpen(true);
                                                }}
                                            >
                                        <Flag className="w-4 h-4" /> Flag
                                            </Button>
                                        )}
                                        <Button 
                                            variant="secondary" 
                                            className={`h-10 px-6 rounded-xl text-[10px] font-normal uppercase border flex items-center gap-2 transition-all ${
                                                review.isFeatured 
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' 
                                                    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                            }`}
                                            onClick={() => handleFeature(review.id, review.isFeatured)}
                                        >
                                            <ThumbsUp className="w-4 h-4" /> {review.isFeatured ? 'Unfeature' : 'Feature'}
                                        </Button>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-11 w-11 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => {
                                            setSelectedReview(review);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Flag Review Dialog */}
            <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Flag Review</DialogTitle>
                        <DialogDescription>
                            Provide a reason for flagging this review. It will be marked for review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedReview && (
                            <div className="p-4 bg-secondary/50 rounded-lg">
                                <p className="text-sm font-medium mb-2">Review:</p>
                                <p className="text-sm text-muted-foreground">"{selectedReview.comment || 'No comment'}"</p>
                                <p className="text-sm text-muted-foreground mt-2">Rating: {selectedReview.rating}/5</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="flagReason">Reason for Flagging *</Label>
                            <Textarea
                                id="flagReason"
                                placeholder="Enter reason for flagging this review..."
                                value={flagReason}
                                onChange={(e) => setFlagReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleFlag} disabled={flagging || !flagReason.trim()}>
                            {flagging ? 'Flagging...' : 'Flag Review'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Review Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the review
                            {selectedReview && ` from ${selectedReview.reviewer?.name || 'user'}`}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
