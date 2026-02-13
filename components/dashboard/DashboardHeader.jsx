"use client";

import React from 'react';
import { User as UserIcon, Settings, LogOut, LayoutDashboard } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export const DashboardHeader = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isSeller, sellerStatus, role } = useAuthStore();
    const normalizedRole = role ? role.toUpperCase() : '';
    const canAccessBoth = (isSeller && sellerStatus === 'APPROVED') || normalizedRole === 'CLIENT & SELLER';

    const isFreelancerView = pathname.startsWith('/dashboard/freelancer');
    const dashboardPath = isFreelancerView ? '/dashboard/freelancer' : '/orders';
    const otherDashboardPath = isFreelancerView ? '/' : '/dashboard/freelancer';

    const getSectionName = () => {
        const parts = pathname.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart === 'client' || lastPart === 'freelancer') return 'Dashboard';
        return lastPart.replace(/-/g, ' ').replace(/_/g, ' ');
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');
    const userRoleDisplay = isFreelancerView ? 'Client & Seller' : 'Client';
    const displayName = user?.name || 'User';

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    const handleSwitch = () => {
        router.push(otherDashboardPath);
    };

    return (
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-normal text-foreground capitalize tracking-tight">
                    {getSectionName()}
                </h2>
            </div>

            <div className="flex items-center gap-5">
                {canAccessBoth && (
                    <RoleSwitcher
                        currentRole={isFreelancerView ? 'freelancer' : 'client'}
                        onSwitch={handleSwitch}
                        isOpen={true}
                        className="w-38 mb-0"
                    />
                )}

                <NotificationDropdown />

                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 cursor-pointer group outline-none select-none">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{displayName}</p>
                                <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">{userRoleDisplay}</p>
                            </div>
                            <Avatar className="w-10 h-10 border border-border shadow-sm transition-transform group-hover:scale-105 rounded-lg overflow-hidden">
                                <AvatarImage src={user?.profileImage} />
                                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mt-2 rounded-2xl bg-card border border-border shadow-xl" align="end">
                        <DropdownMenuLabel className="font-normal p-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-foreground">{displayName}</p>
                                <p className="text-[11px] leading-none text-muted-foreground">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border mx-2" />

                        <div className="p-1 space-y-1">
                         
                            <DropdownMenuItem
                                onClick={() => router.push(`${dashboardPath}/settings`)}
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">My Profile</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => router.push(`${dashboardPath}/settings`)}
                            >
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Settings</span>
                            </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="bg-border mx-2" />

                        <div className="p-1">
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer text-muted-foreground focus:text-foreground hover:bg-secondary focus:bg-secondary transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
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

export default DashboardHeader;
