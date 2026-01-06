"use client";

import React, { useState } from 'react';
import {
    Search, Filter, Eye, MessageSquare,
    Download, CheckCircle2, Clock, XCircle, MoreHorizontal
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

export default function FreelancerOrdersPage() {
    const [orders] = useState([
        { id: 'ORD-8820', client: 'Sarah Miller', service: 'Logo Design', price: 150, deadline: '24h left', status: 'Active' },
        { id: 'ORD-8821', client: 'Tech Corp', service: 'React Components', price: 450, deadline: '3 days left', status: 'Pending' },
        { id: 'ORD-8819', client: 'John Doe', service: 'SEO Audit', price: 120, deadline: 'Delivered', status: 'Delivered' },
        { id: 'ORD-8818', client: 'Unknown User', service: 'Bug Fix', price: 80, deadline: 'Cancelled', status: 'Cancelled' },
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active': return <Badge variant="secondary" className="bg-blue-100 text-blue-600 border-blue-200">Active</Badge>;
            case 'Pending': return <Badge variant="secondary" className="bg-orange-100 text-orange-600 border-orange-200">Pending</Badge>;
            case 'Delivered': return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Delivered</Badge>;
            case 'Cancelled': return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">Orders Management</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Track and manage your project deliveries.</p>
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

            <Card className="rounded-[2rem] border-border overflow-hidden shadow-sm bg-card">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Order ID</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Client & Service</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Deadline</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Revenue</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-secondary/10 transition-colors border-b border-border group">
                                    <TableCell className="px-8 py-5 font-normal text-muted-foreground text-sm">{order.id}</TableCell>
                                    <TableCell className="px-8 py-5">
                                        <div className="font-normal text-foreground text-sm">{order.client}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{order.service}</div>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs font-normal">
                                            {order.status === 'Active' ? <Clock className="w-3 h-3 text-orange-500" /> : <CheckCircle2 className="w-3 h-3 text-primary" />}
                                            <span className={order.status === 'Active' ? 'text-orange-500' : 'text-muted-foreground'}>{order.deadline}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-center">
                                        {getStatusBadge(order.status)}
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-right font-normal text-foreground text-sm">
                                        ${order.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl">
                                                <MessageSquare className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
