'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PostService from '@/components/service/post-service/PostService';
import { toast } from 'sonner';

export default function CreateServicePage() {
    const router = useRouter();

    const handleCancel = () => {
        // Navigate back to services list or dashboard
        router.push('/dashboard/seller/services');
    };

    const handleSave = (service) => {
        console.log("Service Saved:", service);
        toast.success('Service submitted for review', {
            description: 'Your service is under review. You will get a notification once it is approved and goes live.',
        });

        router.push('/dashboard/seller/services');
    };

    return (
        <>
            <PostService onCancel={handleCancel} onSave={handleSave} />
        </>
    );
}
