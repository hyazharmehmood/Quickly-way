"use client";

import React from 'react';
import { DollarSign, FileCheck, Clock, XCircle, Eye, Edit3, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
    const orders = [
        { id: 'ORD-7721', client: 'Ahmed Al-Sayed', service: 'Landscape Concept', price: 345.00, status: 'In Progress' },
        { id: 'ORD-7722', client: 'Jessica Thorne', service: 'Plumbing Repair', price: 120.00, status: 'Completed' },
        { id: 'ORD-7723', client: 'Omar Bakri', service: 'Network Setup', price: 850.00, status: 'Pending' },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Market Vol." value="$12.4k" trend="High liquidity" icon={<TrendingUp />} />
                <MetricCard title="Active Orders" value="28" trend="Steady flow" icon={<ShoppingCart />} />
                <MetricCard title="Total Payout" value="$8.2k" trend="Scheduled" icon={<DollarSign />} />
                <MetricCard title="Delivered" value="142" trend="Verified" icon={<Package />} />
            </div>

            <Card className="border-none rounded-[2rem]">
                <CardHeader className="p-8 border-b border-border">
                    <CardTitle className="text-xl font-normal text-foreground">Job Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Job ID</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Client / Assignment</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Value</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Stage</TableHead>
                                <TableHead className="px-10 py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.25em]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-secondary/20 transition-colors group border-b border-border">
                                    <TableCell className="px-10 py-6 font-normal text-foreground text-base tracking-tighter">{order.id}</TableCell>
                                    <TableCell className="px-10 py-6">
                                        <div className="font-normal text-foreground text-base leading-tight">{order.client}</div>
                                        <div className="text-xs text-muted-foreground font-normal mt-1">{order.service}</div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 font-normal text-foreground text-base">${order.price.toFixed(2)}</TableCell>
                                    <TableCell className="px-10 py-6">
                                        <Badge variant="secondary" className={`px-4 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${order.status === 'Completed' ? 'bg-green-50/50 text-green-600 border-green-100' : 'bg-blue-50/50 text-blue-600 border-blue-100'}`}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl">
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl">
                                                <Edit3 className="w-4 h-4 text-muted-foreground" />
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
