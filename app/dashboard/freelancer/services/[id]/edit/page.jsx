"use client";

import React, { useState, useEffect } from 'react';
import PostService from '@/components/service/post-service/PostService';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

function EditServiceSkeleton() {
    return (
        <Card className="border-none shadow-none">
            <CardContent className="">
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-11 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Skeleton className="h-11 flex-1 rounded-full" />
                        <Skeleton className="h-11 flex-1 rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function EditServicePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const response = await fetch(`/api/services/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setService(data);
                } else {
                    console.error("Failed to fetch service");
                }
            } catch (error) {
                console.error("Error loading service", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchService();
        }
    }, [id]);

    const handleSave = () => {
        toast.success("Service updated successfully!");
        router.push('/dashboard/freelancer/services');
    };

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return <EditServiceSkeleton />;
    }

    if (!service) {
        return <div>Service not found</div>;
    }

    return (
        <div>
            <PostService
                initialData={service}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        </div>
    );
}
