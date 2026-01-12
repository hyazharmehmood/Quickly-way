"use client";

import React, { useState } from 'react';
import { Heart, Search, Grid, List as ListIcon } from 'lucide-react';
import { ServiceCard } from '@/components/service/ServiceCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClientFavoritesPage() {
    const [favorites] = useState([
        {
            id: 's1',
            title: 'Modern Logo Design',
            description: 'I will design a modern and minimalist logo for your brand or company.',
            price: 50,
            rating: 4.9,
            reviews: 42,
            image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop',
            profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
            name: 'Alex Johnson',
            location: 'New York, USA'
        },
        {
            id: 's4',
            title: 'Full Stack Web App',
            description: 'I will build a complete full stack web application with Node & React.',
            price: 800,
            rating: 5.0,
            reviews: 5,
            image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
            profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
            name: 'Sarah Miller',
            location: 'London, UK'
        }
    ]);

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">Saved Services</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Quickly access services you've bookmarked for later.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search favorites..." className="pl-10 h-11 bg-card border-border rounded-xl" />
                    </div>
                    <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-lg bg-secondary text-primary">
                            <Grid className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground">
                            <ListIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {favorites.map((service) => (
                        <div key={service.id} className="group relative">
                            <div className="absolute top-4 right-4 z-10">
                                <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white text-destructive">
                                    <Heart className="w-4 h-4 fill-destructive" />
                                </Button>
                            </div>
                            <ServiceCard service={service} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-96 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-8">
                        <Heart className="w-10 h-10 text-muted-foreground/30" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-normal text-foreground tracking-tight">Your watchlist is empty</h3>
                    <p className="text-muted-foreground font-normal mt-2 max-w-sm">Save services you like and they will appear here for quick access.</p>
                    <Button className="mt-8 h-12 px-8 bg-primary rounded-xl text-primary-foreground font-normal">Explore Services</Button>
                </div>
            )}
        </div>
    );
}
