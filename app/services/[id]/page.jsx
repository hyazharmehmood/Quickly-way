"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ServiceDetails from '@/components/service/ServiceDetails'; // Restored import
import { ServiceDetailsSkeleton } from '@/components/service/ServiceDetailsSkeleton';

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params?.id;

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

                setService(transformedService);
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
        console.log("Contact initiated");
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
