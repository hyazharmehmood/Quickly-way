"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ClipboardList, RefreshCw, Search, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from '@/utils/api';
import { toast } from 'sonner';

const StatusBadge = ({ status }) => {
    switch (status) {
        case 'APPROVED':
            return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Approved</Badge>;
        case 'PENDING_APPROVAL':
            return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Requested</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
        default:
            return <Badge>{status || '—'}</Badge>;
    }
};

export default function AdminServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchServices = async () => {
        try {
            setLoading(true);
            const params = filter === 'all' ? {} : { status: filter };
            const res = await api.get('/admin/services', { params });
            if (res.data?.success) {
                setServices(res.data.services || []);
            }
        } catch (err) {
            console.error('Error fetching services:', err);
            toast.error('Failed to fetch services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [filter]);

    const filteredServices = useMemo(() => {
        if (!searchQuery.trim()) return services;
        const q = searchQuery.toLowerCase().trim();
        return services.filter((s) => {
            const titleMatch = (s.title || '').toLowerCase().includes(q);
            const sellerName = (s.freelancer?.name || '').toLowerCase();
            const sellerEmail = (s.freelancer?.email || '').toLowerCase();
            const sellerMatch = sellerName.includes(q) || sellerEmail.includes(q);
            return titleMatch || sellerMatch;
        });
    }, [services, searchQuery]);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-normal tracking-tight text-foreground">Service Requests</h2>
            <p className="text-muted-foreground text-sm">
                Review and approve or reject seller services. Only approved services appear on the homepage.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or seller name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'PENDING_APPROVAL' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('PENDING_APPROVAL')}
                    >
                        Requested
                    </Button>
                    <Button
                        variant={filter === 'APPROVED' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('APPROVED')}
                    >
                        Approved
                    </Button>
                    <Button
                        variant={filter === 'REJECTED' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('REJECTED')}
                    >
                        Rejected
                    </Button>
                   
                    <Button variant="ghost" size="icon" onClick={fetchServices} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="border-border shadow-none overflow-hidden">
                            <Skeleton className="aspect-16/10 w-full" />
                            <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredServices.length === 0 ? (
                <Card className="border-border shadow-none">
                    <CardContent className="py-12 text-center">
                        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground text-sm">
                            {searchQuery.trim()
                                ? 'No services match your search.'
                                : filter === 'all'
                                    ? 'No services found.'
                                    : `No ${filter === 'PENDING_APPROVAL' ? 'requested' : filter === 'APPROVED' ? 'approved' : 'rejected'} services.`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredServices.map((service) => (
                        <Card
                            key={service.id}
                            className="border-border shadow-none overflow-hidden group hover:border-primary/30 transition-colors"
                        >
                            <div className="relative aspect-16/10 bg-muted">
                                {service.coverImage ? (
                                    <Image
                                        src={service.coverImage}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm">
                                        No image
                                    </div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <StatusBadge status={service.approvalStatus} />
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-medium line-clamp-2 mb-1">{service.title}</h3>
                                <p className="text-sm text-muted-foreground truncate mb-3">
                                    {service.freelancer?.name || '—'}
                                </p>
                                <Link href={`/admin/services/${service.id}`} className="block">
                                    <Button variant="secondary" size="sm" className="w-full">
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        View Service
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
