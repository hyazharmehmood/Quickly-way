"use client";

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
    LayoutDashboard, Briefcase, ShoppingCart, DollarSign,
    MessageSquare, Star, Clock, Settings
} from 'lucide-react';

const freelancerMenu = [
    { icon: <LayoutDashboard />, label: "Dashboard", href: "/dashboard/freelancer" },
    { icon: <Briefcase />, label: "My Services", href: "/dashboard/freelancer/services" },
    { icon: <ShoppingCart />, label: "Orders", href: "/dashboard/freelancer/orders" },
    // { icon: <DollarSign />, label: "Earnings", href: "/dashboard/freelancer/earnings" },
    { icon: <MessageSquare />, label: "Messages", href: "/dashboard/freelancer/messages" },
    // { icon: <Star />, label: "Reviews", href: "/dashboard/freelancer/reviews" },
    // { icon: <Clock />, label: "Availability", href: "/dashboard/freelancer/availability" },
    { icon: <Settings />, label: "Settings", href: "/dashboard/freelancer/settings" },
];

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function FreelancerDashboardLayout({ children }) {
    const { isLoggedIn, role, isLoading } = useAuthStore();
    const router = useRouter();
    const normalizedRole = role?.toUpperCase();

    // Check if user is already authorized to avoid loading flash
    const [isAuthorized, setIsAuthorized] = useState(() => {
        return !isLoading && isLoggedIn && (normalizedRole === 'FREELANCER' || normalizedRole === 'ADMIN');
    });

    useEffect(() => {
        if (!isLoading) {
            if (!isLoggedIn) {
                router.push('/login');
            } else if (normalizedRole !== 'FREELANCER' && normalizedRole !== 'ADMIN') {
                // Redirect unauthorized users to home
                router.push('/');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [isLoggedIn, normalizedRole, isLoading, router]);


    if (isLoading || !isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout menuItems={freelancerMenu} roleName="Freelancer">
            {children}
        </DashboardLayout>
    );
}
