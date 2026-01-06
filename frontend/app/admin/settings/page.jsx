"use client";

import React from 'react';
import { Globe2, Shield, Save, BellRing, UserCog, Smartphone, Languages } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xl font-normal text-foreground">System Config</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary px-5 py-1.5 rounded-full text-xs font-normal uppercase tracking-widest border border-primary/20">
                    Build v2.4.0
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[2rem] border-border shadow-sm flex flex-col h-full bg-card">
                    <CardHeader className="p-10 pb-0 border-none bg-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-[1rem] flex items-center justify-center shadow-inner border border-blue-100">
                                <Globe2 className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-lg font-normal text-foreground tracking-tight">Platform Identity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">Marketplace Branding</label>
                            <Input
                                type="text"
                                defaultValue="Medcon Services"
                                className="h-14 bg-secondary/50 border-none rounded-[1.2rem] focus-visible:ring-primary/20 text-base py-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">Administrative Contact</label>
                            <Input
                                type="email"
                                defaultValue="admin@medcon.com"
                                className="h-14 bg-secondary/50 border-none rounded-[1.2rem] focus-visible:ring-primary/20 text-base py-4"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-border shadow-sm flex flex-col h-full bg-card">
                    <CardHeader className="p-10 pb-0 border-none bg-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-[1rem] flex items-center justify-center shadow-inner border border-destructive/20">
                                <Shield className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-lg font-normal text-foreground tracking-tight">Operational Security</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-6 flex-1">
                        <div className="flex items-center justify-between p-6 bg-secondary/30 rounded-[1.5rem] border border-transparent hover:bg-secondary/50 transition-all group">
                            <div>
                                <p className="font-normal text-foreground text-base">Maintenance Mode</p>
                                <p className="text-sm text-muted-foreground font-normal mt-1">Restrict all access</p>
                            </div>
                            <Switch />
                        </div>

                        <div className="flex items-center justify-between p-6 bg-secondary/30 rounded-[1.5rem] border border-transparent hover:bg-secondary/50 transition-all group">
                            <div>
                                <p className="font-normal text-foreground text-base">Auto-Approval</p>
                                <p className="text-sm text-muted-foreground font-normal mt-1">Skip moderation</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>

                    <CardFooter className="px-10 pb-10">
                        <Button className="w-full h-14 bg-primary text-primary-foreground rounded-[1.5rem] font-normal text-lg shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
                            <Save className="w-6 h-6" /> Commit Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: <BellRing />, title: "Notifications", color: "bg-purple-50/50 text-purple-500 border-purple-100" },
                    { icon: <Smartphone />, title: "App Config", color: "bg-indigo-50/50 text-indigo-500 border-indigo-100" },
                    { icon: <Languages />, title: "Localizations", color: "bg-orange-50/50 text-orange-500 border-orange-100" }
                ].map((box, i) => (
                    <Card key={i} className="rounded-[2rem] border-border shadow-sm flex items-center group cursor-pointer hover:shadow-md transition-all hover:bg-secondary/20 bg-card">
                        <CardContent className="p-8 flex items-center gap-4 w-full">
                            <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all group-hover:scale-110 border ${box.color}`}>
                                {React.cloneElement(box.icon, { className: 'w-6 h-6', strokeWidth: 1.5 })}
                            </div>
                            <span className="text-base font-normal text-foreground">{box.title}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
