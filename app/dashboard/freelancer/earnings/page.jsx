"use client";

import React, { useState, useEffect } from 'react';
import {
    DollarSign, ArrowDownLeft,
    History, TrendingUp, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import api from '@/utils/api';
import { format } from 'date-fns';

export default function FreelancerEarningsPage() {
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ordersRes] = await Promise.all([
                    api.get('/dashboard/freelancer/stats'),
                    api.get('/orders', { params: { status: 'COMPLETED', limit: 50 } }),
                ]);
                if (statsRes.data?.success && statsRes.data?.stats) {
                    setStats(statsRes.data.stats);
                }
                if (ordersRes.data?.success && Array.isArray(ordersRes.data.orders)) {
                    const txs = ordersRes.data.orders.map((o) => ({
                        id: o.id,
                        date: o.completedAt ? format(new Date(o.completedAt), 'dd MMM yyyy') : '-',
                        description: `Order Payment - ${o.orderNumber || o.id.slice(0, 8)}`,
                        type: 'Credit',
                        amount: o.price ?? 0,
                        currency: o.currency || 'USD',
                    }));
                    setTransactions(txs);
                }
            } catch (err) {
                console.error('Failed to fetch earnings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount, currency = 'USD') => {
        if (amount == null) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
    };

    const totalEarnings = stats?.totalEarnings ?? 0;

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Earnings & Wallet</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Manage your payouts and view financial history.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 rounded-[2rem] border-none bg-primary text-primary-foreground p-4 overflow-hidden relative">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-sm font-normal uppercase tracking-widest opacity-80 mb-2">Total Earnings</p>
                            <h3 className="text-5xl font-normal tracking-tighter">
                                {loading ? '...' : formatCurrency(totalEarnings)}
                            </h3>
                        </div>
                        <div className="flex gap-4 mt-12">
                            <Button size="lg" variant="outline" className="text-primary hover:text-primary" disabled>
                                Withdraw Funds
                            </Button>
                            <Button size="lg" variant="outline" className="text-primary hover:text-primary" disabled>
                                Manage Payout Methods
                            </Button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <DollarSign className="w-48 h-48 -mr-12 -mt-12" />
                    </div>
                </Card>

                <div className="space-y-4">
                    <Card className="border-none p-4 rounded-[2rem]">
                        <div className="flex items-center gap-4 ">
                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary border border-border">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">Completed Orders</p>
                                <p className="text-2xl font-normal text-foreground">{loading ? '...' : (stats?.completedOrders ?? 0)}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-none p-4 rounded-[2rem]">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">Lifetime Earnings</p>
                                <p className="text-2xl font-normal text-foreground">{loading ? '...' : formatCurrency(totalEarnings)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="border-none overflow-hidden rounded-[2rem] ">
                <CardHeader className="p-4 border-b border-border flex flex-row justify-between items-center">
                    <CardTitle className="text-xl font-normal">Transaction History</CardTitle>
                    <Button variant="outline" size="sm" className="rounded-xl h-10 border-border" disabled>
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Ref ID</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Date</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Description</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-10 py-8 text-center text-muted-foreground text-sm">Loading...</TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-10 py-8 text-center text-muted-foreground text-sm">No completed orders yet.</TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-secondary/10 border-b border-border transition-colors">
                                        <TableCell className="px-10 py-6 text-sm text-muted-foreground font-normal">{tx.id.slice(0, 8)}</TableCell>
                                        <TableCell className="px-10 py-6 text-sm font-normal text-foreground">{tx.date}</TableCell>
                                        <TableCell className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <ArrowDownLeft className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-normal text-foreground">{tx.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-10 py-6 text-right font-normal text-sm text-primary">
                                            +{formatCurrency(tx.amount, tx.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
