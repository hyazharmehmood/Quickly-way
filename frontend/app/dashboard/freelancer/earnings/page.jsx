"use client";

import React from 'react';
import {
    DollarSign, ArrowUpRight, ArrowDownLeft,
    CreditCard, Building, History, TrendingUp, Download
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

export default function FreelancerEarningsPage() {
    const transactions = [
        { id: 'TX-1001', date: '22 Nov 2024', description: 'Order Payment - ORD-8819', type: 'Credit', amount: 120.00 },
        { id: 'TX-1002', date: '21 Nov 2024', description: 'Withdrawal to Bank Account', type: 'Debit', amount: 500.00 },
        { id: 'TX-1003', date: '19 Nov 2024', description: 'Order Payment - ORD-8790', type: 'Credit', amount: 85.50 },
        { id: 'TX-1004', date: '15 Nov 2024', description: 'Early Payout Recovery', type: 'Debit', amount: 20.00 },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Earnings & Wallet</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Manage your payouts and view financial history.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 rounded-[2.5rem] border-border bg-primary text-primary-foreground p-10 overflow-hidden relative">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-sm font-normal uppercase tracking-widest opacity-80 mb-2">Available Balance</p>
                            <h3 className="text-5xl font-normal tracking-tighter">$1,240.50</h3>
                        </div>
                        <div className="flex gap-4 mt-12">
                            <Button className="h-14 px-8 bg-white text-primary rounded-2xl hover:bg-white/90 text-lg font-normal shadow-xl">
                                Withdraw Funds
                            </Button>
                            <Button variant="outline" className="h-14 px-8 border-white/30 text-white hover:bg-white/10 rounded-2xl text-lg font-normal">
                                Manage Payout Methods
                            </Button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <DollarSign className="w-48 h-48 -mr-12 -mt-12" />
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-[2.5rem] border-border p-8 bg-card shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary border border-border">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">Expected Next Week</p>
                                <p className="text-2xl font-normal text-foreground">$840.00</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="rounded-[2.5rem] border-border p-8 bg-card shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">Lifetime Earnings</p>
                                <p className="text-2xl font-normal text-foreground">$12,840.00</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border-border overflow-hidden shadow-sm bg-card">
                <CardHeader className="p-8 border-b border-border flex flex-row justify-between items-center">
                    <CardTitle className="text-xl font-normal">Transaction History</CardTitle>
                    <Button variant="outline" size="sm" className="rounded-xl h-10 border-border">
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
                            {transactions.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-secondary/10 border-b border-border transition-colors">
                                    <TableCell className="px-10 py-6 text-sm text-muted-foreground font-normal">{tx.id}</TableCell>
                                    <TableCell className="px-10 py-6 text-sm font-normal text-foreground">{tx.date}</TableCell>
                                    <TableCell className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            {tx.type === 'Credit'
                                                ? <ArrowDownLeft className="w-4 h-4 text-primary" />
                                                : <ArrowUpRight className="w-4 h-4 text-destructive" />
                                            }
                                            <span className="text-sm font-normal text-foreground">{tx.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className={`px-10 py-6 text-right font-normal text-sm ${tx.type === 'Credit' ? 'text-primary' : 'text-foreground'}`}>
                                        {tx.type === 'Credit' ? '+' : '-'}${tx.amount.toFixed(2)}
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
