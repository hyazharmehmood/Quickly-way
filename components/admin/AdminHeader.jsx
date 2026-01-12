"use client";

import React from 'react';
import { Bell, Activity, User as UserIcon, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const AdminHeader = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    // Derived section name from pathname
    const getSectionName = () => {
        if (pathname === '/admin') return 'Dashboard';
        const parts = pathname.split('/');
        const lastPart = parts[parts.length - 1];
        return lastPart.replace(/-/g, ' ').replace(/_/g, ' ');
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A');
    const userRole = 'Super User';
    const displayName = user?.name || 'Admin';

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-normal text-foreground capitalize tracking-tight">
                    {getSectionName()}
                </h2>
            </div>

            <div className="flex items-center gap-5">
                <button className="relative text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center rounded-full border border-background font-normal">3</span>
                </button>

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 cursor-pointer group outline-none select-none">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{displayName}</p>
                                <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">{userRole}</p>
                            </div>
                            <Avatar className="w-10 h-10 border border-border shadow-sm transition-transform group-hover:scale-105 rounded-lg overflow-hidden">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mt-2 rounded-2xl bg-card border border-border shadow-xl" align="end">
                        <DropdownMenuLabel className="font-normal p-4">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-foreground">{displayName}</p>
                                <p className="text-[11px] leading-none text-muted-foreground mt-1">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border mx-2" />

                        <div className="p-1 space-y-1">
                            <DropdownMenuItem
                                onClick={() => router.push('/admin')}
                                className=""
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <LayoutDashboard className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Admin Dashboard</span>
                            </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="bg-border mx-2" />

                        <div className="p-1">
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/5 focus:bg-destructive/5 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Logout</span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default AdminHeader;
