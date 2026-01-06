"use client";

import React from 'react';
import { Search, TrendingUp, Globe2, Link, ArrowUp, BarChart3, FileSearch } from 'lucide-react';
import { MetricCard } from '@/components/admin/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SEOPage() {
    const trackedKeywords = [
        { keyword: 'medcon services', volume: '12k', difficulty: 'Low', rank: 1, trend: 'up' },
        { keyword: 'service marketplace saudi', volume: '4.5k', difficulty: 'Medium', rank: 3, trend: 'up' },
        { keyword: 'hire logo designer', volume: '8.2k', difficulty: 'High', rank: 12, trend: 'down' },
        { keyword: 'plumbing service khobar', volume: '1.2k', difficulty: 'Low', rank: 2, trend: 'stable' },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Organic Traffic" value="84.2k" trend="+12% this month" icon={<TrendingUp />} />
                <MetricCard title="Avg. Position" value="4.2" trend="Improved by 0.5" icon={<BarChart3 />} />
                <MetricCard title="Indexed Pages" value="1,240" trend="All pages indexed" icon={<Globe2 />} />
                <MetricCard title="Total Backlinks" value="3,450" trend="+156 new links" icon={<Link />} />
            </div>

            <Card className="rounded-[2.5rem] border-border overflow-hidden shadow-sm bg-card">
                <CardHeader className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <CardTitle className="text-xl font-normal text-foreground">Keyword Tracking</CardTitle>
                        <p className="text-muted-foreground font-normal mt-0.5 text-sm">Monitor search engine visibility for core terms</p>
                    </div>
                    <Button className="h-11 px-6 bg-primary text-primary-foreground rounded-[1rem] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                        Add Keyword
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Target Keyword</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Monthly Vol.</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Difficulty</TableHead>
                                <TableHead className="px-10 py-6 text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Current Rank</TableHead>
                                <TableHead className="px-10 py-6 text-right text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">Trend</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trackedKeywords.map((item, idx) => (
                                <TableRow key={idx} className="hover:bg-secondary/20 transition-colors group border-b border-border">
                                    <TableCell className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <Search className="w-4 h-4" />
                                            </div>
                                            <span className="font-normal text-foreground text-base">{item.keyword}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 text-sm text-muted-foreground font-normal">{item.volume}</TableCell>
                                    <TableCell className="px-10 py-6">
                                        <Badge variant="secondary" className={`px-3 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest border ${item.difficulty === 'High' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                item.difficulty === 'Medium' ? 'bg-orange-50/50 text-orange-600 border-orange-100' :
                                                    'bg-primary/10 text-primary border-primary/20'
                                            }`}>
                                            {item.difficulty}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 font-normal text-foreground text-sm">#{item.rank}</TableCell>
                                    <TableCell className="px-10 py-6 text-right">
                                        <div className={`flex items-center justify-end gap-1.5 text-xs font-normal ${item.trend === 'up' ? 'text-primary' :
                                                item.trend === 'down' ? 'text-destructive' :
                                                    'text-muted-foreground'
                                            }`}>
                                            {item.trend === 'up' && <ArrowUp className="w-3 h-3 rotate-45" />}
                                            {item.trend === 'down' && <ArrowUp className="w-3 h-3 rotate-[225deg]" />}
                                            <span className="capitalize">{item.trend}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border p-8 shadow-sm bg-card">
                <CardHeader className="p-0 mb-8 border-none bg-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                            <FileSearch className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg font-normal text-foreground">On-Page Optimization</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 bg-secondary/30 rounded-[1.5rem] border-transparent hover:bg-card hover:border-border transition-all cursor-pointer group shadow-none">
                            <p className="font-normal text-foreground text-base mb-1">Missing Meta Tags</p>
                            <p className="text-sm text-muted-foreground font-normal">24 pages found with incomplete meta descriptions</p>
                            <div className="mt-4 flex items-center text-primary text-xs font-normal gap-1 group-hover:underline">
                                Run Audit <ArrowUp className="w-3 h-3 rotate-90" />
                            </div>
                        </Card>
                        <Card className="p-6 bg-secondary/30 rounded-[1.5rem] border-transparent hover:bg-card hover:border-border transition-all cursor-pointer group shadow-none">
                            <p className="font-normal text-foreground text-base mb-1">Sitemap Status</p>
                            <p className="text-sm text-muted-foreground font-normal">Sitemap.xml last crawled 12 hours ago</p>
                            <div className="mt-4 flex items-center text-primary text-xs font-normal gap-1 group-hover:underline">
                                Resubmit Sitemap <ArrowUp className="w-3 h-3 rotate-90" />
                            </div>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
