"use client";

import React from 'react';
import { Users, Briefcase, ShoppingCart, DollarSign } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
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
