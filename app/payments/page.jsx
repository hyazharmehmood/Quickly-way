"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import {
    CreditCard, ShieldCheck, Download,
    ArrowUpRight, ArrowDownLeft, FileText, Search, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default function ClientPaymentsPage() {
    const { isLoggedIn, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn && !isLoading) {
            router.push('/login');
        }
    }, [isLoggedIn, isLoading, router]);

    const invoices = [
        { id: 'INV-1024', date: 'Nov 22, 2024', service: 'React Dashboard', status: 'Paid', amount: 450.00 },
        { id: 'INV-1010', date: 'Nov 18, 2024', service: 'Logo Design', status: 'Refunded', amount: 50.00 },
        { id: 'INV-0988', date: 'Oct 12, 2024', service: 'SEO Audit', status: 'Paid', amount: 120.00 },
    ];

    if (isLoading || !isLoggedIn) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in duration-500 space-y-4">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Payments & Invoices</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Manage your billing information and download receipts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 rounded-[2rem] border-none bg-card shadow-sm p-10 overflow-hidden relative">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-normal">Stored Payment Method</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-8 bg-secondary border border-border rounded-lg flex items-center justify-center text-xs font-bold text-foreground">VISA</div>
                                    <span className="text-lg font-normal text-foreground">•••• 8820</span>
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-xl border-border h-10 px-4 font-normal">Change Method</Button>
                        </div>

                        <div className="mt-auto flex items-center gap-6 bg-secondary/30 p-6 rounded-2xl border border-border/50">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base font-normal text-foreground leading-tight">Secure Payments</h4>
                                <p className="text-xs text-muted-foreground mt-1 font-normal">Your payment details are encrypted and processed securely by Stripe.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <CreditCard className="w-64 h-64 -mr-16 -mt-16" strokeWidth={1} />
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-[2rem] border-none p-4 bg-card shadow-sm border-l-4 border-l-primary/40">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-normal">Total Spent</p>
                        <h3 className="text-3xl font-normal text-foreground tracking-tighter">$14,250.00</h3>
                    </Card>
                    <Card className="rounded-[2rem] border-none p-4 bg-card shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-normal">Active Refunds</p>
                        <h3 className="text-3xl font-normal text-foreground tracking-tighter opacity-40">$0.00</h3>
                    </Card>
                </div>
            </div>

            <Card className="rounded-[2rem] border-none overflow-hidden shadow-sm bg-card">
                <CardHeader className="p-8 border-b border-border flex flex-row justify-between items-center">
                    <CardTitle className="text-xl font-normal">Billing History</CardTitle>
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search invoices..." className="pl-10 h-10 bg-secondary/50 border-none rounded-xl" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                    <TableHead className="px-6 md:px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Date</TableHead>
                                    <TableHead className="px-6 md:px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Service</TableHead>
                                    <TableHead className="px-6 md:px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="px-6 md:px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Amount</TableHead>
                                    <TableHead className="px-6 md:px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Receipt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv) => (
                                    <TableRow key={inv.id} className="hover:bg-secondary/10 border-b border-border transition-colors">
                                        <TableCell className="px-6 md:px-10 py-6 text-sm text-foreground font-normal">{inv.date}</TableCell>
                                        <TableCell className="px-6 md:px-10 py-6 text-sm font-normal text-foreground">
                                            {inv.service}
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-normal">{inv.id}</div>
                                        </TableCell>
                                        <TableCell className="px-6 md:px-10 py-6 text-center">
                                            <Badge variant="secondary" className={`font-normal rounded-lg px-2.5 py-1 ${inv.status === 'Paid' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-muted-foreground border-border'}`}>
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 md:px-10 py-6 text-right font-normal text-sm text-foreground">
                                            ${inv.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="px-6 md:px-10 py-6 text-right">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
