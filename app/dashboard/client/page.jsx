"use client";

import React from 'react';
import { ShoppingBag, CheckCircle, Clock, Heart, PlusCircle, Sparkles, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useAuthStore from '@/store/useAuthStore';
import Link from 'next/link';

export default function ClientOverview() {
    const { sellerStatus, user } = useAuthStore();
    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">Client Overview</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Manage your orders and discover new services.</p>
                </div>
                <Button className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    <span>Post a Request</span>
                </Button>
            </div>

            {/* Become a Seller CTA / Status */}
            {(sellerStatus === 'none' || sellerStatus === 'pending' || sellerStatus === 'rejected') && (
                <Card className={`rounded-[2.5rem] border-border overflow-hidden shadow-sm ${sellerStatus === 'pending' ? 'bg-orange-50/50' : 'bg-card'}`}>
                    <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${sellerStatus === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                                {sellerStatus === 'pending' ? <Clock className="w-8 h-8" /> : (sellerStatus === 'rejected' ? <AlertCircle className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />)}
                            </div>
                            <div>
                                <h3 className="text-xl font-normal text-foreground leading-tight">
                                    {sellerStatus === 'none' && "Want to earn as a Freelancer?"}
                                    {sellerStatus === 'pending' && "Your Seller Application is Pending"}
                                    {sellerStatus === 'rejected' && "Seller Application Rejected"}
                                </h3>
                                <p className="text-muted-foreground mt-1 font-normal">
                                    {sellerStatus === 'none' && "Join our marketplace and start offering your professional services today."}
                                    {sellerStatus === 'pending' && "We are currently reviewing your profile. We'll notify you once approved."}
                                    {sellerStatus === 'rejected' && `Reason: ${user?.rejectionReason || "Please check your profile details and try again."}`}
                                </p>
                            </div>
                        </div>
                        <Button asChild className={`h-12 px-8 rounded-xl font-normal ${sellerStatus === 'pending' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary'}`}>
                            <Link href="/become-seller">
                                {sellerStatus === 'none' && "Become a Seller"}
                                {sellerStatus === 'pending' && "Check Status"}
                                {sellerStatus === 'rejected' && "Re-apply Now"}
                            </Link>
                        </Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Active Orders" value="3" trend="1 due today" icon={<ShoppingBag />} />
                <MetricCard title="Completed" value="24" trend="Happy with service" icon={<CheckCircle />} />
                <MetricCard title="Pending Payments" value="$0.00" trend="All clear" icon={<Clock />} />
                <MetricCard title="Saved Services" value="12" trend="Watchlist" icon={<Heart />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 rounded-[2.5rem] border-border h-96 flex flex-col shadow-sm bg-card">
                    <CardHeader className="p-8 border-b border-border flex flex-row justify-between items-center">
                        <CardTitle className="text-xl font-normal">Recent Orders</CardTitle>
                        <Button variant="ghost" className="text-primary hover:text-primary/80 font-normal">View All</Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto">
                        <div className="divide-y divide-border">
                            {[1, 2].map((i) => (
                                <div key={i} className="p-6 flex items-center justify-between hover:bg-secondary/20 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                                            <ShoppingBag className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-base font-normal text-foreground">Custom React Dashboard</p>
                                            <p className="text-xs text-muted-foreground mt-1 font-normal">Freelancer: Alex Johnson • <span className="text-orange-500">In Progress</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-normal text-foreground">$450.00</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Order #ORD-8821</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border h-96 flex flex-col shadow-sm bg-card overflow-hidden">
                    <div className="p-8 bg-primary/5 border-b border-primary/10">
                        <h3 className="text-xl font-normal text-foreground">Discover More</h3>
                        <p className="text-sm text-muted-foreground mt-1 font-normal">Based on your recent interests.</p>
                    </div>
                    <CardContent className="p-6 flex flex-col items-center justify-center flex-1 text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-secondary flex items-center justify-center mb-6">
                            <Heart className="w-8 h-8 text-primary/30" />
                        </div>
                        <p className="text-muted-foreground font-normal max-w-[200px]">Save services to see them here later!</p>
                        <Button variant="outline" className="mt-8 rounded-xl border-border h-11 px-6">Browse Services</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
