
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ServiceDetailsSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-4 ">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Left Column Skeleton */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Header Skeleton */}
                    <Card className=" border-none shadow-sm">
                        <CardContent className="p-6 md:p-6 flex flex-col md:flex-row gap-10">
                            <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between">
                                    <Skeleton className="h-8 w-64" />
                                    <Skeleton className="h-10 w-32 rounded-full" />
                                </div>
                                <Skeleton className="h-6 w-96" />
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <Skeleton className="h-6 w-full" />
                                    <Skeleton className="h-6 w-full" />
                                </div>
                                <div className="flex gap-4 mt-8 pt-8 border-t border-gray-100">
                                    <Skeleton className="h-10 w-32" />
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Skeletons */}
                    <Card className=" border-none shadow-sm"><CardContent className="p-4 md:p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
                    <Card className=" border-none shadow-sm"><CardContent className="p-4 md:p-6"><Skeleton className="h-64 w-full rounded-3xl" /></CardContent></Card>
                    <Card className=" border-none shadow-sm"><CardContent className="p-4 md:p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-1 space-y-4 sticky top-24">
                    <Card className=" border-none shadow-sm">
                        <CardContent className="p-4 md:p-6 space-y-6">
                            <Skeleton className="h-10 w-32 mb-8" />
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                            </div>
                            <Skeleton className="h-12 w-full mt-8" />
                        </CardContent>
                    </Card>
                        <Card className=" border-none shadow-sm"><CardContent className="p-4 md:p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
                </div>
            </div>
        </div>
    );
}
