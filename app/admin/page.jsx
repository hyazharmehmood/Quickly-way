"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Briefcase, ShoppingCart, DollarSign, UserCheck, ArrowRight } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';

export default function AdminPage() {
    const [pendingSellers, setPendingSellers] = useState(0);
    const [pendingJoinRequests, setPendingJoinRequests] = useState(0);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchSellerRequests = async () => {
            try {
                const res = await api.get('/admin/seller-requests');
                const pending = (res.data || []).filter((r) => r.status === 'PENDING').length;
                setPendingSellers(pending);
            } catch {
                // ignore
            }
        };
        fetchSellerRequests();
    }, []);

    useEffect(() => {
        const fetchJoinRequests = async () => {
            try {
                const res = await api.get('/admin/role-agreement-requests');
                const pending = (res.data?.requests || []).filter((r) => r.status === 'PENDING').length;
                setPendingJoinRequests(pending);
            } catch {
                // ignore
            }
        };
        fetchJoinRequests();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                if (res.data?.success && res.data?.stats) {
                    setStats(res.data.stats);
                }
            } catch {
                // ignore
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatNumber = (n) => {
        if (n == null || n === undefined) return '0';
        return new Intl.NumberFormat('en-US').format(n);
    };
    const formatRevenue = (n) => {
        if (n == null || n === undefined) return '$0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
    };

    const s = stats || {};

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-normal tracking-tight text-foreground">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsLoading ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className=" border-border shadow-none">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                        <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                                    </div>
                                    <Skeleton className="h-3 w-28 mt-3" />
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : (
                    <>
                        <MetricCard
                            title="Total Users"
                            value={formatNumber(s.totalUsers)}
                            trend="All registered users"
                            icon={<Users />}
                        />
                        <MetricCard
                            title="Active Services"
                            value={formatNumber(s.activeServices)}
                            trend="Total gigs listed"
                            icon={<Briefcase />}
                        />
                        <MetricCard
                            title="Total Orders"
                            value={formatNumber(s.totalOrders)}
                            trend="All orders"
                            icon={<ShoppingCart />}
                        />
                        <MetricCard
                            title="Revenue"
                            value={formatRevenue(s.revenue)}
                            trend="From completed orders"
                            icon={<DollarSign />}
                        />
                    </>
                )}
            </div>

            {/* Join requests (Client / Seller agreement) - primary flow */}
            <Card className="border shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-normal flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary" />
                        Join requests
                    </CardTitle>
                    <Button asChild variant="default" size="sm" className="rounded-lg">
                        <Link href="/admin/join-requests" className="flex items-center gap-1.5">
                            View & approve
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{pendingJoinRequests}</span> request{pendingJoinRequests !== 1 ? 's' : ''} pending (Join as Client / Join as Seller). Approve to grant access.
                    </p>
                </CardContent>
            </Card>

            {/* Legacy Seller Applications (skills/bio form) - optional */}
            {(pendingSellers > 0) && (
                <Card className="border shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-normal">Legacy seller applications</CardTitle>
                        <Button asChild variant="outline" size="sm" className="rounded-lg">
                            <Link href="/admin/seller-requests" className="flex items-center gap-1.5">
                                View
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{pendingSellers}</span> old-format application{pendingSellers !== 1 ? 's' : ''} pending.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-normal">Analytics Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-48 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-b-[1.5rem]">
                        Chart Placeholder
                    </CardContent>
                </Card>
                <Card className="border shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg font-normal">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="h-48 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-b-[1.5rem]">
                        Activity Feed Placeholder
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
