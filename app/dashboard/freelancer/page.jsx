"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Clock, Star, Activity, FileText, CheckCircle2 } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import api from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function FreelancerOverview() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/freelancer/stats');
                if (res.data?.success && res.data?.stats) {
                    setStats(res.data.stats);
                }
            } catch (err) {
                console.error('Failed to fetch freelancer stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (n) => {
        if (n == null || n === undefined) return '$0';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
    };

    if (loading) {
        return (
            <div className="animate-in fade-in duration-500 space-y-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">Freelancer Overview</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className=" border-border shadow-none">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                                </div>
                                <Skeleton className="h-3 w-20 mt-3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const s = stats || {};
    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Freelancer Overview</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Welcome back! Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard title="Total Earnings" value={formatCurrency(s.totalEarnings)} trend={s.completedOrders ? `${s.completedOrders} completed` : '0 completed'} icon={<DollarSign />} />
                <MetricCard title="Active Orders" value={String(s.activeOrders ?? 0)} trend={s.deliveredOrders ? `${s.deliveredOrders} delivered` : 'In progress'} icon={<ShoppingCart />} />
                <MetricCard title="Completed Orders" value={String(s.completedOrders ?? 0)} trend="Total completed" icon={<CheckCircle2 />} />
                <MetricCard title="Pending Requests" value={String(s.pendingRequests ?? 0)} trend="Awaiting acceptance" icon={<Clock />} />
                <MetricCard title="Pending Offers" value={String(s.pendingOffers ?? 0)} trend="Awaiting client" icon={<FileText />} />
                <MetricCard title="Avg. Rating" value={s.avgRating ?? '0'} trend={s.reviewCount ? `${s.reviewCount} reviews` : 'No reviews yet'} icon={<Star />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-none h-80  flex flex-col ">
                    <CardHeader className="p-8 border-b border-border">
                        <CardTitle className="text-xl font-normal">Income Projection</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 flex items-center justify-center flex-1">
                        <div className="text-muted-foreground flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                                <Activity className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-lg font-normal">Earnings chart placeholder</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none h-80 p flex flex-col ">
                    <CardHeader className="p-8 border-b border-border">
                        <CardTitle className="text-xl font-normal">Upcoming Deadlines</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto max-h-full">
                        <div className="divide-y divide-border">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-6 flex items-center justify-between hover:bg-secondary/20 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-normal text-foreground">Logo Design for Medcon</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Due in 2 days</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-normal text-foreground">$150.00</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
