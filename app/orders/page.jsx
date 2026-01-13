"use client";

import React from 'react';
import {
    ShoppingBag, Search, Filter, Eye, MessageSquare,
    Download, CheckCircle2, Clock, AlertCircle, FileText
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientOrdersPage() {
    const orders = [
        { id: 'ORD-8821', freelancer: 'Alex Johnson', service: 'Custom React Dashboard', price: 450, status: 'In Progress', deadline: 'Due in 3 days' },
        { id: 'ORD-8819', freelancer: 'Sarah Miller', service: 'SEO Audit', price: 120, status: 'Delivered', deadline: 'Delivered 2h ago' },
        { id: 'ORD-8815', freelancer: 'John Doe', service: 'Logo Design', price: 150, status: 'Completed', deadline: 'Completed Nov 20' },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'In Progress': return <Badge variant="secondary" className="bg-blue-100 text-blue-600 border-blue-200">In Progress</Badge>;
            case 'Delivered': return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Delivered</Badge>;
            case 'Completed': return <Badge variant="secondary" className="bg-secondary text-muted-foreground border-border">Completed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4 container mx-auto py-6 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">My Purchases</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Track your orders and manage project delivery.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search orders..." className="pl-10 h-11 bg-card border-border rounded-xl" />
                    </div>
                    <Button variant="outline" className="h-11 px-4 rounded-xl border-border">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <Card key={order.id} className="rounded-[2rem] border-none  transition-all overflow-hidden">
                        <div className="flex flex-col lg:flex-row">
                            <div className="p-5 md:p-8 lg:w-2/3 border-b lg:border-b-0 lg:border-r border-border">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary">
                                            <ShoppingBag className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-normal text-foreground leading-tight">{order.service}</h3>
                                            <p className="text-sm text-muted-foreground mt-1 font-normal">Order #{order.id} • Purchased from <span className="text-foreground font-normal">{order.freelancer}</span></p>
                                        </div>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-normal">Project Amount</p>
                                        <p className="text-xl font-normal text-foreground">${order.price.toFixed(2)}</p>
                                    </div>
                                    <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-normal">Next Milestone</p>
                                        <p className="text-sm font-normal text-foreground">{order.status === 'In Progress' ? 'Draft Review' : 'Final Delivery'}</p>
                                    </div>
                                    <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-normal">Current Progress</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span className="text-sm font-normal text-foreground">{order.deadline}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 md:p-8 lg:w-1/3 bg-secondary/10 flex flex-col justify-center gap-3">
                                <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Eye className="w-4 h-4 mr-2" /> View Project Details
                                </Button>
                                <Button size="lg" variant="outline" className="w-full border-border">
                                    <MessageSquare className="w-4 h-4 mr-2" /> Contact Freelancer
                                </Button>
                                {order.status === 'Delivered' && (
                                    <Button size="lg" variant="secondary" className="w-full bg-primary/10 text-primary border border-primary/20">
                                        <Download className="w-4 h-4 mr-2" /> Download Assets
                                    </Button>
                                )}
                                <Button size="lg" variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                                    <AlertCircle className="w-3.5 h-3.5 mr-2" /> Report an Issue
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
