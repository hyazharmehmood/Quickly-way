"use client";

import React, { useState, useEffect } from 'react';
import PostService from '@/components/service/post-service/PostService';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
                    console.log(">>>>", data);
                    setService(data);
                } else {
                    console.error("Failed to fetch service");
                    // router.push('/dashboard/freelancer/services'); 
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
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
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
