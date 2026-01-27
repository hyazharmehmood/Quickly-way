"use client";

import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Briefcase, UserPlus, UserMinus, Search, Download, Eye, XCircle, CheckCircle2, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
    const router = useRouter();
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [metrics, setMetrics] = useState({
        activeClients: 0,
        providers: 0,
        newSignups: 0,
        blockedUsers: 0,
    });

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        calculateMetrics();
    }, [allUsers]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Always fetch all users, we'll filter client-side
            const response = await api.get('/admin/users');
            if (response.data.success) {
                setAllUsers(response.data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = () => {
        const clients = allUsers.filter(u => u.role === 'CLIENT');
        const freelancers = allUsers.filter(u => u.role === 'FREELANCER');
        const admins = allUsers.filter(u => u.role === 'ADMIN');
        
        // Calculate new signups (last 24 hours)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const newSignups = allUsers.filter(u => new Date(u.createdAt) > yesterday).length;

        setMetrics({
            activeClients: clients.length,
            providers: freelancers.length,
            newSignups,
            blockedUsers: 0, // You can add a blocked/suspended status field later
        });
    };

    const getUserType = (user) => {
        if (user.role === 'ADMIN') return 'Admin';
        if (user.role === 'FREELANCER') return 'Freelancer';
        return 'Client';
    };

    const getUserTypeBadgeColor = (user) => {
        if (user.role === 'ADMIN') return 'bg-purple-50/50 text-purple-600 border-purple-100';
        if (user.role === 'FREELANCER') return 'bg-indigo-50/50 text-indigo-600 border-indigo-100';
        return 'bg-orange-50/50 text-orange-600 border-orange-100';
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
    };

    // Search is handled client-side in filteredUsers

    const filteredUsers = allUsers.filter(user => {
        // Filter by active tab
        if (activeTab === 'client' && user.role !== 'CLIENT') return false;
        if (activeTab === 'freelancer' && user.role !== 'FREELANCER') return false;
        if (activeTab === 'admin' && user.role !== 'ADMIN') return false;
        
        // Filter by search query
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
        );
    });

    const handleViewUser = (userId) => {
        router.push(`/admin/users/${userId}`);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    title="Active Clients" 
                    value={metrics.activeClients.toLocaleString()} 
                    trend={`${metrics.activeClients} total`} 
                    icon={<UsersIcon />} 
                />
                <MetricCard 
                    title="Freelancers" 
                    value={metrics.providers.toLocaleString()} 
                    trend={`${metrics.providers} total`} 
                    icon={<Briefcase />} 
                />
                <MetricCard 
                    title="New Signups" 
                    value={metrics.newSignups.toString()} 
                    trend="Last 24 hours" 
                    icon={<UserPlus />} 
                />
                <MetricCard 
                    title="Admins" 
                    value={allUsers.filter(u => u.role === 'ADMIN').length.toString()} 
                    trend="Platform admins" 
                    icon={<UserMinus />} 
                />
            </div>

            <Card className="border-none rounded-[2rem]">
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
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                        <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-11 w-11 rounded-[1rem]"
                            onClick={fetchUsers}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5 text-muted-foreground" />
                            )}
                        </Button>
                        <Button variant="secondary" size="icon" className="h-11 w-11 rounded-[1rem]">
                            <Download className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-8 py-4 border-b border-border">
                            <TabsList className="bg-transparent h-auto p-0 gap-1">
                                <TabsTrigger 
                                    value="all" 
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[0.5rem] px-6 py-2"
                                >
                                    All Users
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="client" 
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[0.5rem] px-6 py-2"
                                >
                                    Clients
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="freelancer" 
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[0.5rem] px-6 py-2"
                                >
                                    Freelancers
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="admin" 
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-[0.5rem] px-6 py-2"
                                >
                                    Admins
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value={activeTab} className="mt-0">
                            {loading ? (
                                <div className="">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Full Identity</TableHead>
                                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Account Category</TableHead>
                                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Current Status</TableHead>
                                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Registration</TableHead>
                                                <TableHead className="px-4 py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Command</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[...Array(5)].map((_, index) => (
                                                <TableRow key={index} className="border-b border-border">
                                                    <TableCell className="px-4 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <Skeleton className="w-12 h-12 rounded-[1rem]" />
                                                            <div className="space-y-2">
                                                                <Skeleton className="h-4 w-32" />
                                                                <Skeleton className="h-3 w-40" />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-6">
                                                        <Skeleton className="h-6 w-20 rounded-full" />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-6">
                                                        <Skeleton className="h-5 w-16" />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-6">
                                                        <Skeleton className="h-4 w-24" />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Skeleton className="h-9 w-9 rounded-xl" />
                                                            <Skeleton className="h-9 w-9 rounded-xl" />
                                                            <Skeleton className="h-9 w-9 rounded-xl" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No users found{searchQuery ? ' matching your search' : ''}
                                </div>
                            ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Full Identity</TableHead>
                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Account Category</TableHead>
                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Current Status</TableHead>
                                <TableHead className="px-4 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Registration</TableHead>
                                <TableHead className="px-4 py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Command</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                                        {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-secondary/20 transition-colors group border-b border-border">
                                    <TableCell className="px-4 py-6">
                                        <div className="flex items-center gap-4">
                                                        {user.profileImage ? (
                                                            <img 
                                                                src={user.profileImage} 
                                                                alt={user.name}
                                                                className="w-12 h-12 rounded-[1rem] object-cover border border-border"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-[1rem] bg-background border border-border flex items-center justify-center font-normal text-foreground text-lg shadow-sm">
                                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </div>
                                                        )}
                                            <div>
                                                            <div className="font-normal text-foreground text-sm leading-tight">{user.name || 'Unknown User'}</div>
                                                <div className="text-xs text-muted-foreground font-normal mt-1">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-6">
                                                    <Badge variant="secondary" className={`px-4 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${getUserTypeBadgeColor(user)}`}>
                                                        {getUserType(user)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-6">
                                        <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                                        <span className="text-sm font-normal text-foreground">Active</span>
                                        </div>
                                    </TableCell>
                                                    <TableCell className="px-4 py-6 text-sm text-muted-foreground font-normal">
                                                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                                </TableCell>
                                    <TableCell className="px-4 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button 
                                                            variant="secondary" 
                                                            size="icon" 
                                                            className="h-9 w-9 rounded-xl"
                                                            onClick={() => handleViewUser(user.id)}
                                                        >
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
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
