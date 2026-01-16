"use client";

import React, { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';
import { Clock, Calendar, ShieldCheck, Save, Coffee, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Dynamically import Switch to prevent SSR issues
const Switch = dynamicImport(
    () => import("@/components/ui/switch").then(mod => ({ default: mod.Switch })),
    { ssr: false, loading: () => <div className="w-10 h-6" /> }
);

// This page requires client-side state
// Using dynamic imports with ssr: false to prevent build-time analysis

export default function FreelancerAvailabilityPage() {
    const [mounted, setMounted] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [vacationMode, setVacationMode] = useState(false);

    // Ensure component is mounted before rendering
    useEffect(() => {
        setMounted(true);
    }, []);

    // Show loading state during SSR
    if (!mounted) {
        return (
            <div className="animate-in fade-in duration-500 space-y-4">
                <div className="h-20 bg-card rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-96 bg-card rounded-2xl animate-pulse" />
                    <div className="h-96 bg-card rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    // Define workingHours after mounted check to prevent SSR evaluation
    const workingHours = [
        { day: 'Monday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Tuesday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Wednesday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Thursday', hours: '09:00 AM - 06:00 PM', active: true },
        { day: 'Friday', hours: '09:00 AM - 01:00 PM', active: true },
        { day: 'Saturday', hours: 'Closed', active: false },
        { day: 'Sunday', hours: 'Closed', active: false },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-normal text-foreground tracking-tight">Availability & Scheduling</h2>
                    <p className="text-muted-foreground font-normal mt-1 text-sm">Control when you are visible to potential clients.</p>
                </div>
                <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-2xl border border-border shadow-sm">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`}></div>
                    <span className="text-sm font-normal text-foreground">{isOnline ? 'Currently Accepting Orders' : 'Offline'}</span>
                    <div className="h-6 w-px bg-border mx-2"></div>
                    <Switch checked={isOnline} onCheckedChange={setIsOnline} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-none rounded-[2rem]">
                    <CardHeader className="p-4 border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100">
                                <Sun className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-normal">Working Hours</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border">
                            {workingHours.map((item) => (
                                <div key={item.day} className="px-10 py-6 flex items-center justify-between hover:bg-secondary/20 transition-all">
                                    <div>
                                        <p className="text-base font-normal text-foreground">{item.day}</p>
                                        <p className={`text-sm font-normal mt-1 ${item.active ? 'text-muted-foreground' : 'text-destructive opacity-60'}`}>
                                            {item.hours}
                                        </p>
                                    </div>
                                    <Switch defaultChecked={item.active} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="border-none rounded-[2rem] p-4">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
                                <Moon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-normal">Vacation Mode</CardTitle>
                                <p className="text-sm text-muted-foreground font-normal mt-1">Temporarily hide all your services from search.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-[1rem] border border-border flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <span className="text-base font-normal text-foreground">Activate Hibernation</span>
                                <Switch checked={vacationMode} onCheckedChange={setVacationMode} />
                            </div>
                            <p className="text-sm text-muted-foreground font-normal leading-relaxed">
                                When activated, you won't receive new orders. Existing active orders must still be completed.
                            </p>
                        </div>
                    </Card>

                    <Card className=" rounded-[2rem] border-none bg-primary text-primary-foreground p-10 overflow-hidden relative  shadow-primary/20">
                        <div className="relative z-10">
                            <h3 className="text-xl font-normal mb-2">Automated Payouts</h3>
                            <p className="text-sm opacity-80 font-normal mb-8 leading-relaxed max-w-[280px]">
                                Your earnings are automatically cleared and sent to your wallet every Friday at midnight.
                            </p>
                            <Button size="lg" variant="outline" className=" hover:text-primary text-primary hover:bg-white/90 ">
                                <ShieldCheck className="w-5 h-5" /> Security Settings
                            </Button>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Clock className="w-40 h-40 -mr-12 -mt-12" />
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3 px-2">
                        <Button variant="outline" size="lg" className="  border-border text-foreground">Discard Changes</Button>
                        <Button size="lg" className=" ">
                            <Save className="w-5 h-5" />
                            <span>Save Schedule</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
