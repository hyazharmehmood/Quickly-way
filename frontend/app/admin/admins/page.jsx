"use client";

import React, { useState } from 'react';
import { Plus, ShieldCheck, UserCog, Trash2, Headphones, Activity } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminsPage() {
    const [mockAdmins, setMockAdmins] = useState([
        { id: '1', name: 'Ehab Alamri', email: 'ehab@medcon.com', role: 'SUPER', status: 'Active', joined: '15 Nov 2024' },
        { id: '2', name: 'Sarah Jenkins', email: 'sarah.j@medcon.com', role: 'SUPPORT', status: 'Active', joined: '18 Nov 2024' },
        { id: '3', name: 'General Staff', email: 'user.staff@medcon.com', role: 'USER', status: 'Active', joined: '01 Nov 2024' },
    ]);

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Staff Members" value={mockAdmins.length.toString()} trend="Full authorization" icon={<ShieldCheck />} />
                <MetricCard title="Super Users" value="1" trend="Global reach" icon={<ShieldCheck />} />
                <MetricCard title="Support Team" value="1" trend="Active queue" icon={<Headphones />} />
                <MetricCard title="Online Status" value="1" trend="Live command" icon={<Activity />} />
            </div>

            <Card className="border-none rounded-[2rem] overflow-hidden ">
                <CardHeader className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <CardTitle className="text-xl font-normal text-foreground">Admin Command</CardTitle>
                        <p className="text-muted-foreground font-normal mt-0.5 text-sm">Staff authorization and permission control</p>
                    </div>
                    <Button className="h-11">
                        <Plus className="w-5 h-5 mr-2" strokeWidth={2} /> Add Staff
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Administrative User</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Operational Role</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">System Access</TableHead>
                                <TableHead className="px-10 py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Action Unit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockAdmins.map((admin) => (
                                <TableRow key={admin.id} className="hover:bg-secondary/20 transition-colors group border-b border-border">
                                    <TableCell className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1rem] bg-primary/10 border border-primary/20 flex items-center justify-center font-normal text-primary text-lg shadow-sm">{admin.name.charAt(0)}</div>
                                            <div>
                                                <div className="font-normal text-foreground text-sm leading-tight">{admin.name}</div>
                                                <div className="text-xs text-muted-foreground font-normal mt-1">{admin.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6">
                                        <Badge variant="secondary" className={`px-4 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${admin.role === 'SUPER' ? 'bg-orange-50/50 text-orange-600 border-orange-100' : 'bg-blue-50/50 text-blue-600 border-blue-100'}`}>
                                            {admin.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${admin.status === 'Active' ? 'bg-primary' : 'bg-destructive'}`} />
                                            <span className={`text-sm font-normal ${admin.status === 'Active' ? 'text-foreground' : 'text-destructive'}`}>{admin.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="icon" className="h-10 w-10 bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all border-border hover:border-primary/20">
                                                <UserCog className="w-5 h-5" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="h-10 w-10 bg-destructive/10 text-destructive rounded-xl hover:text-destructive hover:bg-destructive/20 transition-all border-destructive/20">
                                                <Trash2 className="w-5 h-5" />
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
