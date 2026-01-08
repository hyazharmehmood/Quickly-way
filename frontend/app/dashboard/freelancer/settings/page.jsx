"use client";

import React from 'react';
import { Settings, User, Bell, Shield, Languages, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function SettingsPlaceholder() {
    return (
        <div className="animate-in fade-in duration-500 space-y-4 ">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Manage your profile, notifications, and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                    {[
                        { icon: <User />, label: 'Profile Info', active: true },
                        { icon: <Bell />, label: 'Notifications', active: false },
                        { icon: <Shield />, label: 'Security', active: false },
                        { icon: <Languages />, label: 'Appearance', active: false }
                    ].map((item, i) => (
                        <Button key={i} size="lg" className={`flex  w-full items-center gap-4  cursor-pointer transition-all ${item.active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground border border-border hover:bg-secondary/50'}`}>
                            {React.cloneElement(item.icon, { className: 'w-5 h-5', strokeWidth: 1.5 })}
                            <span className="text-base font-normal">{item.label}</span>
                        </Button>
                    ))}
                </div>

                <Card className="md:col-span-2 border-none space-y-4 p-4 rounded-[2rem]">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                            <User className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-normal">Personal Information</CardTitle>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">Display Name</label>
                            <Input defaultValue="Alex Johnson" className="h-12 bg-secondary/50 border-none rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">Email Address</label>
                            <Input defaultValue="alex.j@example.com" className="h-12 bg-secondary/50 border-none rounded-xl" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">Professional Bio</label>
                            <textarea
                                className="w-full min-h-[120px] bg-secondary/50 border-none rounded-2xl p-4 text-sm font-normal focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                                defaultValue="I am a professional designer with 5+ years of experience in creating brand identities."
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border flex justify-end">
                        <Button size="lg" className=" shadow-primary/20 hover:bg-primary/90 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Profile
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
