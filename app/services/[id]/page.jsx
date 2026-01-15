"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ServiceDetails from '@/components/service/ServiceDetails'; // Restored import
import { ServiceDetailsSkeleton } from '@/components/service/ServiceDetailsSkeleton';
// Removed API import - using Socket.IO only
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
                console.log("Service Data:", data);

                // Store raw data for contact functionality
                const rawServiceData = data;

                // Transform API data to Component expected structure
                const transformedService = {
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    subCategory: data.subCategory,
                    price: data.price,
                    priceBreakdowns: data.priceBreakdowns || [],
                    rating: 5.0, // Default
                    reviewCount: 0, // Default
                    hires: 0, // Default

                    // Cover & Gallery Logic
                    coverType: data.coverType || 'IMAGE',
                    coverText: data.coverText,
                    coverColor: data.coverColor,

                    galleryUrls: [
                        data.coverImage || data.thumbnail || data.images?.[0],
                        ...(data.images || [])
                    ].filter(Boolean).filter((url, index, self) => self.indexOf(url) === index),

                    bio: data.freelancer?.bio || "",
                    skills: data.freelancer?.skills || [],
                    yearsExperience: 1,

                    provider: {
                        name: data.freelancer?.name || "Freelancer",
                        avatarUrl: data.freelancer?.profileImage || "",
                        location: "Remote",
                        languages: data.freelancer?.languages || ["English"],
                        memberSince: new Date(data.freelancer?.createdAt).getFullYear().toString(),
                        isOnline: false,
                        availability: data.freelancer?.availability || []
                    },

                    paymentMethods: ["Credit Card", "PayPal"],
                    reviewsList: []
                };

                setService({
                    ...transformedService,
                    freelancerId: data.freelancerId || data.freelancer?.id,
                    rawData: rawServiceData, // Store raw data for contact
                });
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
            // Check if user is logged in
            if (!isLoggedIn || !user) {
                toast.error('Please login to contact the freelancer');
                router.push('/login');
                return;
            }

            // Get freelancer ID from service
            const freelancerId = service?.freelancerId || service?.rawData?.freelancer?.id || service?.rawData?.freelancerId;
            
            if (!freelancerId) {
                toast.error('Unable to find freelancer information');
                return;
            }

            // Check if trying to contact yourself
            if (freelancerId === user.id) {
                toast.error('You cannot contact yourself');
                return;
            }

            if (!socket || !isConnected) {
                toast.error('Please wait for connection...', { id: 'contact' });
                return;
            }

            toast.loading('Starting conversation...', { id: 'contact' });

            // Set up event listeners
            let timeoutId;
            
            const handleConversationCreated = (data) => {
                clearTimeout(timeoutId);
                toast.dismiss('contact');
                if (data.conversation) {
                    toast.success('Conversation started!', { id: 'contact' });
                    // Navigate to messages page with conversation ID
                    router.push(`/messages?conversationId=${data.conversation.id}`);
                } else {
                    toast.error('Failed to start conversation', { id: 'contact' });
                }
                // Clean up listeners
                socket.off('conversation:created', handleConversationCreated);
                socket.off('error', handleError);
            };


            const handleError = (errorData) => {
                clearTimeout(timeoutId);
                toast.dismiss('contact');
                const errorMessage = typeof errorData === 'string' 
                    ? errorData 
                    : (errorData?.message || 'Failed to start conversation');
                toast.error(errorMessage, { id: 'contact' });
                // Clean up listeners
                socket.off('conversation:created', handleConversationCreated);
                socket.off('error', handleError);
            };

            socket.once('conversation:created', handleConversationCreated);
            socket.once('error', handleError);

            // Create or get existing conversation via Socket.IO
            socket.emit('create_conversation', { otherUserId: freelancerId });
            
            // Timeout after 10 seconds if no response
            timeoutId = setTimeout(() => {
                socket.off('conversation:created', handleConversationCreated);
                socket.off('error', handleError);
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
            moreServices={[]}
            onNavigateToService={handleNavigateToService}
            onContact={handleContact}
        />
    );
}
