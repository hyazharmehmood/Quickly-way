"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function OrderDetailSkeleton() {
    return (
        <div className="max-w-7xl mx-auto py-6 px-4 md:px-6 animate-in fade-in duration-500 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border shadow-none">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-64" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="space-y-1">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-20 rounded-xl" />
                                <Skeleton className="h-20 rounded-xl" />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-40" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-5 w-16 rounded-full" />
                                                    <Skeleton className="h-5 w-12 rounded-full" />
                                                </div>
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-16 w-full rounded-lg" />
                                    <Skeleton className="h-9 w-32 rounded-lg mt-3" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i}>
                                        <div className="flex items-start gap-4 py-4">
                                            <Skeleton className="h-3 w-3 rounded-full mt-1" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                        {i < 2 && <Separator className="ml-7" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border shadow-none">
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-14 h-14 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-6 w-28" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-14 h-14 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardContent className="p-6 space-y-3">
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
