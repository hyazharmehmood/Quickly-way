"use client";

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
    LayoutDashboard, ShoppingBag, Send, Heart,
    MessageSquare, CreditCard, Settings
} from 'lucide-react';

const clientMenu = [
    { icon: <LayoutDashboard />, label: "Dashboard", href: "/dashboard/client" },
    { icon: <ShoppingBag />, label: "My Orders", href: "/dashboard/client/orders" },
    { icon: <Send />, label: "My Requests", href: "/dashboard/client/requests" },
    { icon: <Heart />, label: "Favorites", href: "/dashboard/client/favorites" },
    { icon: <MessageSquare />, label: "Messages", href: "/dashboard/client/messages" },
    { icon: <CreditCard />, label: "Payments", href: "/dashboard/client/payments" },
    { icon: <Settings />, label: "Settings", href: "/dashboard/client/settings" },
];

export default function ClientDashboardLayout({ children }) {
    return (
        <DashboardLayout menuItems={clientMenu} roleName="Client">
            {children}
        </DashboardLayout>
    );
}
