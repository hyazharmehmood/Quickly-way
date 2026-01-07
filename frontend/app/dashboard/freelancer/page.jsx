"use client";

import React from 'react';
import { DollarSign, ShoppingCart, Clock, Star, Activity } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function FreelancerOverview() {
    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Freelancer Overview</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Welcome back! Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <MetricCard title="Total Earnings" value="$2250" trend="+12% this month" icon={<DollarSign />} />
                <MetricCard title="Active Orders" value="12" trend="3 due soon" icon={<ShoppingCart />} />
                <MetricCard title="Pending Requests" value="8" trend="4 new" icon={<Clock />} />
                <MetricCard title="Avg Rating" value="4.9" trend="124 reviews" icon={<Star />} />
                <Card className="rounded-[1.5rem] border-border shadow-sm flex flex-col p-4 bg-card">
                    <p className="text-muted-foreground text-[14px] font-normal tracking-tight mb-2">Profile Completion</p>
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-xl font-normal text-foreground tracking-tight">85%</span>
                        <Activity className="w-5 h-5 text-primary opacity-20" />
                    </div>
                    <Progress value={85} className="h-2 bg-secondary" />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[2.5rem] border-border h-80 flex flex-col shadow-sm bg-card">
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

                <Card className="rounded-[2.5rem] border-border h-80 flex flex-col shadow-sm bg-card">
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
