'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PostService from '@/components/service/post-service/PostService';
import { toast } from 'sonner';

export default function CreateServicePage() {
    const router = useRouter();

    const handleCancel = () => {
        // Navigate back to services list or dashboard
        router.push('/dashboard/freelancer/services');
    };

    const handleSave = (service) => {
        // In a real app, you would send this 'service' object to your API
        console.log("Service Saved:", service);
        toast.success("Service created successfully!");

        // Redirect after save
        router.push('/dashboard/freelancer/services');
    };

    return (
        <>
            <PostService onCancel={handleCancel} onSave={handleSave} />
        </>
    );
}
