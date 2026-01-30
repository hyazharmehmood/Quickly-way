"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    Star, User, MapPin, Calendar, Globe, Mail, Phone,
    ArrowLeft, MessageSquare, Repeat, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ServiceCard } from '@/components/service/ServiceCard';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '@/store/useAuthStore';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import { toast } from 'sonner';
import Image from 'next/image';

export default function FreelancerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const freelancerId = params?.id;
    const { user, isLoggedIn } = useAuthStore();
    const { socket, isConnected } = useGlobalSocket();

    const [freelancer, setFreelancer] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!freelancerId) return;

        const fetchFreelancerProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/freelancer/${freelancerId}`);
                if (!response.ok) {
                    if (response.status === 404) throw new Error("Freelancer not found");
                    throw new Error("Failed to load profile");
                }
                const data = await response.json();
                
                if (data.success) {
                    setFreelancer(data.freelancer);
                    setServices(data.services || []);
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFreelancerProfile();
    }, [freelancerId]);

    const handleContact = () => {
        try {
            if (!isLoggedIn || !user) {
                toast.error('Please login to contact the freelancer');
                router.push('/login');
                return;
            }

            if (freelancerId === user.id) {
                toast.error('You cannot contact yourself');
                return;
            }

            if (!socket || !isConnected) {
                toast.error('Please wait for connection...', { id: 'contact' });
                return;
            }

            toast.loading('Starting conversation...', { id: 'contact' });

            let timeoutId;
            
            const cleanup = () => {
                clearTimeout(timeoutId);
                socket.off('conversation:created', handleConversationCreated);
                socket.off('error', handleError);
            };
            
            const handleConversationCreated = (data) => {
                cleanup();
                toast.dismiss('contact');
                if (data.conversation) {
                    toast.success('Conversation started!', { id: 'contact' });
                    router.push(`/messages?conversationId=${data.conversation.id}`);
                } else {
                    toast.error('Failed to start conversation', { id: 'contact' });
                }
            };

            const handleError = (errorData) => {
                cleanup();
                toast.dismiss('contact');
                const errorMessage = typeof errorData === 'string' 
                    ? errorData 
                    : (errorData?.message || 'Failed to start conversation');
                toast.error(errorMessage, { id: 'contact' });
            };

            socket.once('conversation:created', handleConversationCreated);
            socket.once('error', handleError);
            socket.emit('create_conversation', { otherUserId: freelancerId });
            
            timeoutId = setTimeout(() => {
                cleanup();
                toast.dismiss('contact');
                toast.error('Connection timeout. Please try again.', { id: 'contact' });
            }, 10000);
        } catch (error) {
            console.error('Error starting conversation:', error);
            toast.dismiss('contact');
            toast.error('Failed to start conversation', { id: 'contact' });
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
                <div className="space-y-6">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !freelancer) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4 md:px-6">
                <Card className="rounded-[2rem] border-none">
                    <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">{error || 'Freelancer not found'}</p>
                        <Button onClick={() => router.back()} className="mt-4">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Get all reviews from all services
    const allReviews = services.flatMap(service => 
        (service.reviews || []).map(review => ({
            ...review,
            service: {
                id: service.id,
                title: service.title,
                coverImage: service.coverImage,
                coverType: service.coverType,
                coverText: service.coverText,
                coverColor: service.coverColor,
            }
        }))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate repeat clients (clients who have multiple orders)
    const clientOrderCounts = {};
    services.forEach(service => {
        service.reviews?.forEach(review => {
            if (review.reviewerId) {
                clientOrderCounts[review.reviewerId] = (clientOrderCounts[review.reviewerId] || 0) + 1;
            }
        });
    });

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8">
           

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Services */}
                <Card className="lg:col-span-2 space-y-8 shadow-none border-none rounded-2xl    ">
                    <CardContent>
                        {services.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {services.map((service) => {
                                    const transformedService = {
                                        ...service,
                                        freelancerId: service.freelancerId || freelancerId,
                                        provider: {
                                            name: freelancer.name,
                                            avatarUrl: freelancer.profileImage,
                                            location: freelancer.location || "Remote"
                                        },
                                        thumbnailUrl: service.coverImage || service.images?.[0],
                                        rating: service.rating || 5.0,
                                        reviewCount: service.reviewCount || 0
                                    };
                                    return (
                                        <ServiceCard key={service.id} service={transformedService} />
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="rounded-2xl border-none shadow-sm">
                                <CardContent className="p-12 text-center">
                                    <p className="text-muted-foreground">No services available yet</p>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>

                    {/* Reviews Section - Enhanced */}
                    {allReviews.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-foreground">
                                    Reviews
                                </h3>
                                <span className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full font-medium">
                                    {allReviews.length} {allReviews.length === 1 ? 'review' : 'reviews'}
                                </span>
                            </div>
                            <div className="space-y-5">
                                {allReviews.map((review) => {
                                    const isRepeatClient = clientOrderCounts[review.reviewerId] > 1;
                                    const reviewDate = review.createdAt 
                                        ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                                        : 'Recently';
                                    
                                    // Get order info if available
                                    const order = review.order;
                                    const service = review.service;
                                    
                                    return (
                                        <Card 
                                            key={review.id} 
                                            className=" border-none shadow-sm"
                                        >
                                            <CardContent className="p-6">
                                                {/* Reviewer Info - Enhanced */}
                                                <div className="flex items-start gap-4 mb-5">
                                                    <div className="flex-shrink-0 relative group">
                                                        {review.reviewer?.profileImage ? (
                                                            <img
                                                                src={review.reviewer.profileImage}
                                                                alt={review.reviewer.name}
                                                                className="w-16 h-16 rounded-full object-cover border-2 border-background shadow-md ring-2 ring-primary/10 transition-transform group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-background shadow-md ring-2 ring-primary/10 flex items-center justify-center text-primary font-black text-xl transition-transform group-hover:scale-105">
                                                                {(review.reviewer?.name || 'A').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                                            <span className="font-bold text-lg text-foreground">
                                                                {review.reviewer?.name || 'Anonymous'}
                                                            </span>
                                                            {isRepeatClient && (
                                                                <Badge variant="outline" className="text-xs flex items-center gap-1.5 bg-primary/10 border-primary/20 text-primary px-2 py-0.5">
                                                                    <Repeat className="w-3 h-3" />
                                                                    Repeat Client
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex items-center gap-0.5">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star
                                                                        key={star}
                                                                        className={`w-4 h-4 ${
                                                                            star <= review.rating
                                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                                : 'text-gray-300'
                                                                        }`}
                                                                        strokeWidth={1.5}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground">
                                                                {review.rating}
                                                            </span>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-xs text-muted-foreground font-medium">
                                                                {reviewDate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Review Text - Enhanced */}
                                                {review.comment && (
                                                    <p className="text-base text-foreground/85 mb-5 leading-relaxed pl-20">
                                                        {review.comment}
                                                    </p>
                                                )}

                                                {/* Service/Order Info - Enhanced */}
                                                {(order || service) && (
                                                    <div className="flex items-center gap-6 pt-5 border-t border-border/50 pl-20">
                                                        {order && (
                                                            <>
                                                                
                                                                {order.completedAt && order.createdAt && (
                                                                    <div className="text-xs bg-secondary/50 px-3 py-2 rounded-lg">
                                                                        <p className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide">Duration</p>
                                                                        <p className="font-bold text-foreground text-sm">
                                                                            {Math.ceil(
                                                                                (new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)
                                                                            )} days
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                        {service && (
                                                            <div className="flex items-center gap-3 ml-auto bg-secondary/30 px-3 py-2 rounded-lg">
                                                                {service.coverImage ? (
                                                                    <img
                                                                        src={service.coverImage}
                                                                        alt={service.title}
                                                                        className="w-12 h-12 rounded-lg object-cover border border-border shadow-sm"
                                                                    />
                                                                ) : service.coverType === 'TEXT' ? (
                                                                    <div className={`w-12 h-12 rounded-lg ${service.coverColor || 'bg-primary'} flex items-center justify-center border border-border shadow-sm`}>
                                                                        <span className="text-white text-[8px] font-bold text-center px-1 leading-tight">
                                                                            {service.coverText?.slice(0, 20)}
                                                                        </span>
                                                                    </div>
                                                                ) : null}
                                                                <div>
                                                                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                                                                        {service.title}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Sidebar - Sticky Profile with Overview */}
                <div className="sticky top-8 self-start">
                    <Card className="rounded-[2rem] border-none shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
                        <CardContent className="p-6">
                            {/* Profile Section */}
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="relative group mb-4">
                                    {freelancer.profileImage ? (
                                        <img
                                            src={freelancer.profileImage}
                                            alt={freelancer.name}
                                            className="w-28 h-28 rounded-full object-cover border-2 border-background shadow-xl ring-4 ring-primary/10 transition-transform group-hover:scale-105 mx-auto"
                                        />
                                    ) : (
                                        <div className="w-28 h-28 rounded-full border-4 border-background shadow-xl ring-4 ring-primary/10 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center transition-transform group-hover:scale-105 mx-auto">
                                            <User className="w-16 h-16 text-primary/70" />
                                        </div>
                                    )}
                                  
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    {freelancer.name}
                                </h2>
                                <div className="flex items-center justify-center gap-2 text-sm mb-4">
                                    <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-foreground text-xs">
                                            {freelancer.rating?.toFixed(1) || '5.0'}
                                        </span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                        ({freelancer.reviewCount || 0} reviews)
                                    </span>
                                </div>
                                {freelancer.bio && (
                                    <p className="text-sm text-foreground/75 leading-relaxed mb-4 line-clamp-3">
                                        {freelancer.bio}
                                    </p>
                                )}
                                <Button 
                                    onClick={handleContact} 
                                    className="w-full  mb-4"
                                    variant="default"
                                    size="lg"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Contact Me
                                </Button>
                            </div>
                            
                            <Separator className="mb-6 bg-border/50" />
                            
                            {/* Overview Section - Integrated */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">Overview</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground mb-1">
                                            {freelancer.reviewCount || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Reviews</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <p className="text-2xl font-bold text-foreground">
                                                {freelancer.rating?.toFixed(1) || '5.0'}
                                            </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Rating</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground mb-1">
                                            {services.length}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Gigs</p>
                                    </div>
                                </div>
                            </div>
                            
                            <Separator className="mb-4 bg-border/50" />
                            
                            {/* Location & Info */}
                            <div className="space-y-3">
                                {freelancer.location && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="font-medium truncate">{freelancer.location}</span>
                                    </div>
                                )}
                                {freelancer.languages && freelancer.languages.length > 0 && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="font-medium truncate">{freelancer.languages.join(', ')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="font-medium">Member since {new Date(freelancer.createdAt).getFullYear()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

