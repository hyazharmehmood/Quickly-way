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
    // { icon: <Settings />, label: "Settings", href: "/dashboard/freelancer/settings" },
];

export default function FreelancerDashboardLayout({ children }) {
    return (
        <DashboardLayout menuItems={freelancerMenu} roleName="Freelancer">
            {children}
        </DashboardLayout>
    );
}
