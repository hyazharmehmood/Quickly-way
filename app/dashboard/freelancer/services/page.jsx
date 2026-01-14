"use client";

import React, { useState } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, Eye, Power } from 'lucide-react';
import Link from 'next/link';
import { ServiceCard } from '@/components/service/ServiceCard';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function FreelancerServicesPage() {
    const [myServices, setMyServices] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('/api/services');
                if (response.ok) {
                    const data = await response.json();

                    // Transform data to match ServiceCard expectation if needed
                    // ServiceCard likely expects: id, title, price, etc.
                    // The API returns creating structure.

                    const transformed = data.map(service => ({
                        id: service.id,
                        title: service.title,
                        description: service.description || '', // Ensure not null
                        price: service.price,
                        rating: 0, // Default for now
                        reviews: 0, // Default for now
                        status: 'Published', // Basic assumption or add status to model later
                        image: service.coverImage || (service.images && service.images[0]) || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop',
                        coverType: service.coverType,
                        coverText: service.coverText,
                        coverColor: service.coverColor,
                        coverImage: service.coverImage,

                        profileImage: service.freelancer?.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg',
                        name: service.freelancer?.name || 'Freelancer',
                        location: 'Remote' // Default
                    }));

                    setMyServices(transformed);
                }
            } catch (error) {
                console.error("Failed to fetch services", error);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    if (loading) {
        return (
            <div className="animate-in fade-in duration-500 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-11 w-48 rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full flex flex-col">
                            {/* Media Area */}
                            <Skeleton className="w-full aspect-[11/7] rounded-t-xl" />

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-grow gap-4">
                                {/* Provider Info */}
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>

                                {/* Title/Desc */}
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-[80%]" />
                                </div>

                                {/* Footer */}
                                <div className="mt-auto flex items-center justify-between pt-2">
                                    <Skeleton className="h-5 w-12" /> {/* Rating */}
                                    <Skeleton className="h-6 w-16" /> {/* Price */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Published': return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Published</Badge>;
            case 'Draft': return <Badge variant="secondary" className="bg-secondary/80 text-muted-foreground border-border">Draft</Badge>;
            case 'Rejected': return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">My Services</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Create and manage your professional offerings.</p>
                </div>
                <Link href="/dashboard/freelancer/services/create">
                    <Button size="lg" className="">
                        <Plus className="w-5 h-5" />
                        <span>Create New Service</span>
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {myServices.map((service) => (
                    <div key={service.id} className="relative group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Link href={`/dashboard/freelancer/services/${service.id}/edit`}>
                                        <DropdownMenuItem className="cursor-pointer">
                                            <Edit2 className="mr-2 h-4 w-4" />
                                          
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem className="text-red-600 cursor-pointer">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <ServiceCard service={service} />
                    </div>
                ))}
            </div>
        </div>
    );
}
