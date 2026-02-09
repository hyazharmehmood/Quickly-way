"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Briefcase, ShoppingCart, DollarSign, UserCheck, ArrowRight } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import api from '@/utils/api';

export default function AdminPage() {
    const [pendingSellers, setPendingSellers] = useState(0);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/admin/seller-requests');
                const pending = (res.data || []).filter((r) => r.status === 'PENDING').length;
                setPendingSellers(pending);
            } catch {
                // ignore
            }
        };
        fetch();
    }, []);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Users"
                    value="12,345"
                    trend="+12% from last month"
                    icon={<Users />}
                />
                <MetricCard
                    title="Active Services"
                    value="423"
                    trend="+5% from last month"
                    icon={<Briefcase />}
                />
                <MetricCard
                    title="Total Orders"
                    value="1,204"
                    trend="+23% from last month"
                    icon={<ShoppingCart />}
                />
                <MetricCard
                    title="Revenue"
                    value="$45,231"
                    trend="+8% from last month"
                    icon={<DollarSign />}
                />
            </div>

            {/* Seller Requests - View & Approve */}
            <Card className="border-none rounded-[2rem]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-normal flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-primary" />
                        Become-seller requests
                    </CardTitle>
                    <Button asChild variant="default" size="sm" className="rounded-lg">
                        <Link href="/admin/seller-requests" className="flex items-center gap-1.5">
                            View & approve
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{pendingSellers}</span> application{pendingSellers !== 1 ? 's' : ''} pending review.
                        Open seller requests to view details and approve or reject.
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-none rounded-[2rem]">
                    <CardHeader>
                        <CardTitle className="text-lg font-normal">Analytics Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-48 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-b-[1.5rem]">
                        Chart Placeholder
                    </CardContent>
                </Card>
                <Card className="border-none">
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
