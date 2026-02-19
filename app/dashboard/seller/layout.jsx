"use client";

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
    LayoutDashboard, Briefcase, ShoppingCart, DollarSign,
    MessageSquare, Star, Clock, Settings, AlertCircle
} from 'lucide-react';

const freelancerMenu = [
    { icon: <LayoutDashboard />, label: "Dashboard", href: "/dashboard/seller" },
    { icon: <Briefcase />, label: "My Services", href: "/dashboard/seller/services" },
    { icon: <ShoppingCart />, label: "Orders", href: "/dashboard/seller/orders" },
    { icon: <AlertCircle />, label: "Dispute", href: "/dashboard/seller/disputes" },
    // { icon: <DollarSign />, label: "Earnings", href: "/dashboard/seller/earnings" },
    { icon: <MessageSquare />, label: "Messages", href: "/dashboard/seller/messages" },

    // { icon: <Star />, label: "Reviews", href: "/dashboard/seller/reviews" },
    // { icon: <Clock />, label: "Availability", href: "/dashboard/seller/availability" },
    // { icon: <Settings />, label: "Settings", href: "/dashboard/seller/settings" },
];

export default function FreelancerDashboardLayout({ children }) {
    return (
        <DashboardLayout menuItems={freelancerMenu} roleName="Seller">
            {children}
        </DashboardLayout>
    );
}
