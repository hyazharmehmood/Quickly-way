"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ServiceDetails from '@/components/service/ServiceDetails';
import { ServiceDetailsSkeleton } from '@/components/service/ServiceDetailsSkeleton';
import useAuthStore from '@/store/useAuthStore';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import { toast } from 'sonner';

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params?.id;

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const { isLoggedIn, user } = useAuthStore();
    const { socket, isConnected } = useGlobalSocket();

    useEffect(() => {
        if (!serviceId) return;

        const fetchService = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/services/${serviceId}`);
                if (!response.ok) {
                    if (response.status === 404) throw new Error("Service not found");
                    throw new Error("Failed to load service");
                }
                const data = await response.json();
                console.log('SERVICE DATA', data);
                // Reviews are now included in the service API response (optimized - no separate API calls)
                const allReviews = data.reviews || [];
                const avgRating = data.rating || 5.0;
                const reviewCount = data.reviewCount || 0;
                
                console.log('Reviews from service API:', allReviews.length, 'Rating:', avgRating);

                const getUniqueGalleryUrls = () => {
                    const urls = [
                        data.coverImage || data.thumbnail || data.images?.[0],
                        ...(data.images || [])
                    ].filter(Boolean);
                    return urls.filter((url, index, self) => self.indexOf(url) === index);
                };

                // Transform reviews to match ServiceDetails component format
                const transformedReviews = allReviews.map(review => {
                    // Determine if this is an order-based review
                    const isOrderReview = review.isOrderReview === true || review.orderId !== null;
                    const orderInfo = review.order || (isOrderReview ? { id: review.orderId, orderNumber: null } : null);
                    
                    return {
                        id: review.id,
                        userName: review.reviewer?.name || 'Anonymous',
                        userAvatar: review.reviewer?.profileImage || null,
                        rating: review.rating || 5,
                        comment: review.comment || '',
                        date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        }) : 'Recently',
                        details: isOrderReview && orderInfo 
                            ? `Order #${orderInfo.orderNumber || orderInfo.id?.slice(0, 8) || 'N/A'}` 
                            : 'Service Review'
                    };
                });
                
                console.log('Transformed reviews:', transformedReviews.length);

                const transformedService = {
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    subCategory: data.subCategory,
                    price: data.price,
                    priceBreakdowns: data.priceBreakdowns || [],
                    rating: avgRating,
                    reviewCount: reviewCount,
                    hires: data.orderCount || 0,
                    coverType: data.coverType || 'IMAGE',
                    coverText: data.coverText,
                    coverColor: data.coverColor,
                    galleryUrls: getUniqueGalleryUrls(),
                    bio: data.freelancer?.bio || "",
                    skills: data.skills?.filter(ss => {
                        const status = ss.skill?.approvalStatus;
                        return (status === 'APPROVED' || status == null) && ss.skill?.name;
                    }).map(ss => ss.skill?.name || '').filter(Boolean) || [],
                    yearsExperience: 1,
                    provider: {
                        name: data.freelancer?.name || "Freelancer",
                        avatarUrl: data.freelancer?.profileImage || "",
                        location: data.freelancer?.location || "Remote",
                        languages: data.freelancer?.languages || ["English"],
                        memberSince: new Date(data.freelancer?.createdAt).getFullYear().toString(),
                        isOnline: false,
                        availability: data.freelancer?.availability || [],
                        employmentStatus: data.freelancer?.employmentStatus || null,
                    },
                    paymentMethods: data.paymentMethods && Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
                    paymentMethodsText: data.paymentMethodsText || null,
                    paymentMethodsTextAr: data.paymentMethodsTextAr || null,
                    reviewsList: transformedReviews,
                    freelancerId: data.freelancerId || data.freelancer?.id,
                    rawData: data
                };

                setService(transformedService);
                // Always set reviews, even if empty array
                setReviews(transformedReviews || []);
                console.log('Reviews state set:', transformedReviews.length, transformedReviews);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [serviceId]);

    const handleNavigateToService = (s) => {
        router.push(`/services/${s.id}`);
    };

    const handleContact = () => {
        try {
            if (!isLoggedIn || !user) {
                toast.error('Please login to contact the freelancer');
                router.push('/login');
                return;
            }

            const freelancerId = service?.freelancerId || service?.rawData?.freelancer?.id || service?.rawData?.freelancerId;
            
            if (!freelancerId) {
                toast.error('Unable to find freelancer information');
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

    if (loading) return <ServiceDetailsSkeleton />;
    if (error) return <div className="min-h-screen grid place-items-center text-red-500">Error: {error}</div>;
    if (!service) return <div className="min-h-screen grid place-items-center">Service not found</div>;

    return (
        <ServiceDetails
            service={service}
            reviews={reviews}
            moreServices={[]}
            onNavigateToService={handleNavigateToService}
            onContact={handleContact}
        />
    );
}
