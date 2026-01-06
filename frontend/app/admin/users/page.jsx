"use client";

import React, { useState } from 'react';
import { Users as UsersIcon, Briefcase, UserPlus, UserMinus, Search, Download, Eye, XCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function UsersPage() {
    const [platformUsers, setPlatformUsers] = useState([
        { id: 'u1', name: 'Ahmed Al-Sayed', email: 'ahmed@example.com', type: 'Client', status: 'Active', joined: '10 Nov 2024' },
        { id: 'u2', name: 'Jessica Thorne', email: 'jess.t@example.com', type: 'Provider', status: 'Active', joined: '12 Nov 2024' },
        { id: 'u3', name: 'Omar Bakri', email: 'omar@example.com', type: 'Client', status: 'Suspended', joined: '05 Nov 2024' },
        { id: 'u4', name: 'Linda Vance', email: 'linda@example.com', type: 'Provider', status: 'Active', joined: '18 Nov 2024' },
        { id: 'u5', name: 'Kevin Hart', email: 'kevin@example.com', type: 'Client', status: 'Active', joined: '20 Nov 2024' },
    ]);

    const toggleStatus = (id) => {
        setPlatformUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Active Clients" value="28.4k" trend="4% increase" icon={<UsersIcon />} />
                <MetricCard title="Providers" value="12.4k" trend="2.1% higher" icon={<Briefcase />} />
                <MetricCard title="New Signups" value="86" trend="+12 vs yesterday" icon={<UserPlus />} />
                <MetricCard title="Blocked Users" value="412" trend="Manual review" icon={<UserMinus />} />
            </div>

            <Card className="rounded-[2.5rem] border-border overflow-hidden shadow-sm">
                <CardHeader className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <CardTitle className="text-xl font-normal text-foreground">User Registry</CardTitle>
                        <p className="text-muted-foreground font-normal mt-0.5 text-sm">Manage platform access and member profiles</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Input
                                type="text"
                                placeholder="Search by name or email..."
                                className="pl-12 pr-4 h-11 bg-secondary/50 rounded-[1rem] border-none focus-visible:ring-primary/20"
                            />
                            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                        <Button variant="secondary" size="icon" className="h-11 w-11 rounded-[1rem]">
                            <Download className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Full Identity</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Account Category</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Current Status</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Registration</TableHead>
                                <TableHead className="px-10 py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Command</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {platformUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-secondary/20 transition-colors group border-b border-border">
                                    <TableCell className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1rem] bg-background border border-border flex items-center justify-center font-normal text-foreground text-lg shadow-sm">{user.name.charAt(0)}</div>
                                            <div>
                                                <div className="font-normal text-foreground text-sm leading-tight">{user.name}</div>
                                                <div className="text-xs text-muted-foreground font-normal mt-1">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6">
                                        <Badge variant="secondary" className={`px-4 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${user.type === 'Provider' ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100' : 'bg-orange-50/50 text-orange-600 border-orange-100'}`}>
                                            {user.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-primary' : 'bg-destructive'}`} />
                                            <span className={`text-sm font-normal ${user.status === 'Active' ? 'text-foreground' : 'text-destructive'}`}>{user.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-sm text-muted-foreground font-normal">{user.joined}</TableCell>
                                    <TableCell className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => toggleStatus(user.id)}
                                                className={`h-9 w-9 rounded-xl border ${user.status === 'Active' ? 'text-orange-500 bg-orange-50/50 border-orange-100 hover:bg-orange-100' : 'text-primary bg-primary/10 border-primary/20 hover:bg-primary/20'}`}
                                            >
                                                {user.status === 'Active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            </Button>
                                            <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl">
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                                                <Trash2 className="w-4 h-4" />
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
