"use client";

import React from 'react';
import { Bell, Activity } from 'lucide-react';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

export const AdminHeader = () => {
    const pathname = usePathname();
    const { user } = useAuthStore();

    // Derived section name from pathname
    const getSectionName = () => {
        if (pathname === '/admin') return 'Dashboard';
        const parts = pathname.split('/');
        const lastPart = parts[parts.length - 1];
        return lastPart.replace(/_/g, ' ');
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A');
    const userRole = user?.role === 'admin' ? 'Super User' : (user?.isSeller ? 'Freelancer' : 'Client');
    const displayName = user?.name || 'Admin';

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-normal text-[#002f34] capitalize tracking-tight">
                    {getSectionName()}
                </h2>
            </div>

            <div className="flex items-center gap-5">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#f0fff4] text-[#10b981] rounded-full text-[10px] font-normal border border-[#c6f6d5] uppercase tracking-wider">
                    <Activity className="w-3 h-3" /> SYSTEM LIVE
                </div>
                <button className="relative text-gray-400 hover:text-gray-900 transition-colors">
                    <Bell className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ff5660] text-white text-[9px] flex items-center justify-center rounded-full border border-white font-normal">3</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-normal text-gray-900 leading-tight">{displayName}</p>
                        <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">{userRole}</p>
                    </div>
                    <div className="w-9 h-9 bg-[#10b981] rounded-lg flex items-center justify-center text-white font-normal text-base shadow-md">
                        {userInitial}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
