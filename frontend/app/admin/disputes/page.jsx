"use client";

import React from 'react';
import { ShieldAlert, Calendar, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DisputesPage() {
    const disputes = [
        { id: 'd1', reporter: 'Client_99', reason: 'Fraud', status: 'High', date: '10 Nov', description: 'User requested external payment through Telegram.' },
        { id: 'd2', reporter: 'Alex_Smith', reason: 'Poor service', status: 'Medium', date: '11 Nov', description: 'Did not complete the task as specified in the brief.' },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Critical" value="2" trend="Active priority" icon={<AlertTriangle className="text-destructive" />} />
                <MetricCard title="Moderate" value="14" trend="Pending review" icon={<ShieldAlert className="text-orange-500" />} />
                <MetricCard title="Resolved" value="86" trend="Total solved" icon={<ShieldCheck />} />
                <MetricCard title="Safe Ratio" value="98%" trend="Trusted score" icon={<Activity />} />
            </div>

            <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden bg-card">
                <CardHeader className="p-10 border-b border-border flex flex-row justify-between items-center bg-card">
                    <CardTitle className="text-xl font-normal text-foreground">Case Unit</CardTitle>
                    <Button variant="outline" className="px-6 py-2 bg-secondary/50 text-muted-foreground rounded-full text-[10px] font-normal uppercase tracking-widest hover:bg-secondary transition-all h-auto border-border">
                        Audit Log
                    </Button>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border">
                    {disputes.map((dispute) => (
                        <div key={dispute.id} className="p-10 hover:bg-secondary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <Badge variant="outline" className={`px-5 py-1.5 rounded-full text-[9px] font-normal uppercase tracking-[0.2em] shadow-sm border-0 ${dispute.status === 'High' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-orange-50/50 text-orange-600 border-orange-100'}`}>
                                        Priority: {dispute.status}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground font-normal flex items-center gap-1.5 uppercase tracking-widest">
                                        <Calendar className="w-4 h-4" /> Filed {dispute.date}
                                    </span>
                                </div>
                                <h4 className="text-xl font-normal text-foreground mb-2">{dispute.reason} Complaint</h4>
                                <p className="text-base text-muted-foreground font-normal leading-relaxed max-w-4xl">{dispute.description}</p>
                            </div>
                            <div className="flex flex-col gap-3 min-w-[180px]">
                                <Button className="w-full h-12 bg-primary text-primary-foreground rounded-[1.2rem] font-normal text-sm shadow-md transition-all hover:bg-primary/90">
                                    Resolve Case
                                </Button>
                                <Button variant="outline" className="w-full h-12 bg-background border-border text-foreground rounded-[1.2rem] font-normal text-sm hover:bg-secondary transition-all">
                                    View Details
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
