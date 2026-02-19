"use client";

import React, { useState } from 'react';
import {
    LayoutDashboard, Users as UsersIcon, UserCheck, ShieldCheck, Briefcase,
    ShoppingCart, AlertCircle, Star, Search, Settings as SettingsIcon,
    LogOut, ChevronLeft, ChevronRight, FolderTree, Tag, Headphones, Image as ImageIcon,
    ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const SidebarLink = ({ icon, label, href, active, isOpen }) => (
    <Link
        href={href}
        className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[0.5rem] transition-all font-normal ${active
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
    >
        <span className={`${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            {React.cloneElement(icon, { className: 'w-5 h-5', strokeWidth: 1.5 })}
        </span>
        {isOpen && <span className="text-md tracking-tight">{label}</span>}
    </Link>
);

export const Sidebar = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(true);
    const pathname = usePathname();

    const menuItems = [
        { icon: <LayoutDashboard />, label: "Dashboard", href: "/admin" },
        { icon: <UsersIcon />, label: "Users", href: "/admin/users" },
        { icon: <UserCheck />, label: "Join Requests", href: "/admin/join-requests" },
        { icon: <Briefcase />, label: "Seller Requests", href: "/admin/seller-requests" },
        { icon: <ClipboardList />, label: "Service Requests", href: "/admin/services" },
        { icon: <ShoppingCart />, label: "Orders", href: "/admin/orders" },
        { icon: <AlertCircle />, label: "Disputes", href: "/admin/disputes" },
        { icon: <Headphones />, label: "Support Tickets", href: "/admin/support-tickets" },
        { icon: <Star />, label: "Reviews", href: "/admin/reviews" },
        { icon: <FolderTree />, label: "Categories", href: "/admin/categories" },
        { icon: <Tag />, label: "Skills", href: "/admin/skills" },
        { icon: <ImageIcon />, label: "Banners", href: "/admin/banners" },
        { icon: <Search />, label: "SEO", href: "/admin/seo" },
        { icon: <SettingsIcon />, label: "Settings", href: "/admin/settings" },
    ];

    return (
        <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 flex flex-col  h-screen sticky top-0`}>
            {/* Logo area */}
            <div className="p-6 flex items-center justify-between h-20">
                <div className="flex items-center gap-4">
                    <Image src="/images/qw logo tran.png" alt="Quicklyway Logo" width={140} height={40} />
                    {/* <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground flex-shrink-0 shadow-lg shadow-primary/20">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    {isOpen && <span className="font-normal text-lg tracking-tight text-foreground">Admin</span>} */}
                </div>
                {/* Collapse toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground transition-all hidden lg:block"
                >
                    {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                    <SidebarLink
                        key={item.href}
                        {...item}
                        active={pathname === item.href}
                        isOpen={isOpen}
                    />
                ))}
            </nav>

            {/* Logout section */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 px-4 py-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-normal text-lg"
                >
                    <LogOut className="w-4 h-4" />
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
