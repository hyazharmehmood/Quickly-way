"use client";

import React from 'react';
import {
    Send, Plus, Search, Filter,
    MoreHorizontal, Clock, CheckCircle, XCircle
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

export default function ClientRequestsPage() {
    const requests = [
        { id: 'REQ-101', title: 'React Expert needed for Component Library', date: 'Nov 22, 2024', budget: '$500 - $1,000', status: 'Open', proposals: 12 },
        { id: 'REQ-100', title: 'Minimalist Logo for Healthcare Brand', date: 'Nov 18, 2024', budget: '$50 - $150', status: 'In Progress', proposals: 45 },
        { id: 'REQ-099', title: 'Python Scraper for Real Estate data', date: 'Nov 15, 2024', budget: '$200', status: 'Closed', proposals: 8 },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open': return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Open</Badge>;
            case 'In Progress': return <Badge variant="secondary" className="bg-blue-100 text-blue-600 border-blue-200">In Progress</Badge>;
            case 'Closed': return <Badge variant="secondary" className="bg-secondary text-muted-foreground border-border">Closed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">My Requests</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Manage public requests and service inquiries.</p>
                </div>
                <Button className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Create New Request</span>
                </Button>
            </div>

            <Card className="rounded-[2.5rem] border-border overflow-hidden shadow-sm bg-card">
                <div className="p-8 border-b border-border bg-secondary/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" className="rounded-xl h-10 px-4 bg-background border border-border">All Requests</Button>
                        <Button variant="ghost" className="rounded-xl h-10 px-4">Open</Button>
                        <Button variant="ghost" className="rounded-xl h-10 px-4">Archived</Button>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search requests..." className="pl-10 h-10 bg-background border-border rounded-xl" />
                        </div>
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">ID</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Request Title</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Proposals</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-center">Status</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Budget</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id} className="hover:bg-secondary/10 transition-colors border-b border-border group">
                                    <TableCell className="px-10 py-6 font-normal text-muted-foreground text-sm">{req.id}</TableCell>
                                    <TableCell className="px-10 py-6">
                                        <div className="font-normal text-foreground text-base max-w-sm truncate">{req.title}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-normal">Posted on {req.date}</div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-center">
                                        <Badge variant="secondary" className="bg-secondary/50 text-foreground font-normal rounded-lg px-3 py-1">
                                            {req.proposals} Offers
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-center">
                                        {getStatusBadge(req.status)}
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-right font-normal text-foreground text-sm">
                                        {req.budget}
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="secondary" className="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-normal">
                                                View Offers
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
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
