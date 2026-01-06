"use client";

import React, { useState } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, Eye, Power } from 'lucide-react';
import { ServiceCard } from '@/components/service/ServiceCard';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function FreelancerServicesPage() {
    const [myServices, setMyServices] = useState([
        {
            id: 's1',
            title: 'Modern Logo Design',
            description: 'I will design a modern and minimalist logo for your brand or company.',
            price: 50,
            rating: 4.9,
            reviews: 42,
            status: 'Published',
            image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop',
            profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
            name: 'Alex Johnson',
            location: 'New York, USA'
        },
        {
            id: 's2',
            title: 'React Website Development',
            description: 'I will build a high-performance React website with Tailwind CSS.',
            price: 250,
            rating: 5.0,
            reviews: 18,
            status: 'Draft',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
            profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
            name: 'Alex Johnson',
            location: 'New York, USA'
        },
        {
            id: 's3',
            title: 'SEO Audit & Optimization',
            description: 'I will perform a full SEO audit and optimize your website for search engines.',
            price: 120,
            rating: 4.7,
            reviews: 29,
            status: 'Rejected',
            image: 'https://images.unsplash.com/photo-1571721795195-a2ca2d3370a9?w=400&h=250&fit=crop',
            profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
            name: 'Alex Johnson',
            location: 'New York, USA'
        }
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Published': return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Published</Badge>;
            case 'Draft': return <Badge variant="secondary" className="bg-secondary/80 text-muted-foreground border-border">Draft</Badge>;
            case 'Rejected': return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">My Services</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Create and manage your professional offerings.</p>
                </div>
                <Button className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Create New Service</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {myServices.map((service) => (
                    <div key={service.id} className="group relative">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <div className="backdrop-blur-md bg-background/80 rounded-full shadow-sm px-1">
                                {getStatusBadge(service.status)}
                            </div>
                        </div>

                        <div className="relative">
                            <ServiceCard service={service} />

                            <div className="absolute bottom-4 right-4 z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-background/90 backdrop-blur-md shadow-lg hover:bg-background">
                                            <MoreVertical className="w-5 h-5 text-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                            <Edit2 className="w-4 h-4" /> Edit Service
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                            <Eye className="w-4 h-4" /> View Listing
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                            <Power className="w-4 h-4" /> {service.status === 'Published' ? 'Deactivate' : 'Publish'}
                                        </DropdownMenuItem>
                                        <div className="h-px bg-border my-1"></div>
                                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
