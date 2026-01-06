"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, ShieldCheck, ArrowLeftRight, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

const SidebarLink = ({ icon, label, href, active, isOpen }) => (
    <Link
        href={href}
        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-[1rem] transition-all font-normal ${active
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
    >
        <span className={`${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            {React.cloneElement(icon, { className: 'w-5 h-5', strokeWidth: 1.5 })}
        </span>
        {isOpen && <span className="text-lg tracking-tight">{label}</span>}
    </Link>
);

export const DashboardSidebar = ({ menuItems, roleName = "User", onLogout }) => {
    const [isOpen, setIsOpen] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isSeller, sellerStatus } = useAuthStore();

    const isFreelancerView = pathname.startsWith('/dashboard/freelancer');
    const canSwitch = isSeller && sellerStatus === 'approved';

    const handleToggleRole = () => {
        if (isFreelancerView) {
            router.push('/dashboard/client');
        } else {
            router.push('/dashboard/freelancer');
        }
    };

    const handleLogout = () => {
        useAuthStore.getState().logout();
        router.push('/login');
    };

    return (
        <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 flex flex-col z-[70] h-screen sticky top-0`}>
            {/* Logo area */}
            <div className="p-6 flex items-center justify-between h-20">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground flex-shrink-0 shadow-lg shadow-primary/20">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    {isOpen && <span className="font-normal text-lg tracking-tight text-foreground">{roleName}</span>}
                </div>
                {/* Collapse toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground transition-all hidden lg:block"
                >
                    {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>

            {/* Role Switcher */}
            {canSwitch && isOpen && (
                <div className="px-4 mb-4">
                    <button
                        onClick={handleToggleRole}
                        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary rounded-2xl border border-border group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary border border-border">
                                <ArrowLeftRight className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">Switch to</p>
                                <p className="text-sm font-normal text-foreground leading-none">{isFreelancerView ? "Client" : "Freelancer"}</p>
                            </div>
                        </div>
                    </button>
                </div>
            )}

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
                {/* User Profile Summary */}
                {isOpen && user && (
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-normal text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-normal text-lg"
                >
                    <LogOut className="w-4 h-4" />
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
