"use client";

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 6;

export function SellerRequestsTableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">User</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Skills</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Status</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Applied Date</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: ROWS }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border">
                        <TableCell className="px-8 py-6">
                            <Skeleton className="h-4 w-28 mb-2" />
                            <Skeleton className="h-3 w-40" />
                        </TableCell>
                        <TableCell className="px-8 py-6">
                            <div className="flex flex-wrap gap-1.5">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="px-8 py-6">
                            <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                                <Skeleton className="h-9 w-16 rounded-lg" />
                                <Skeleton className="h-9 w-20 rounded-lg" />
                                <Skeleton className="h-9 w-16 rounded-lg" />
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default SellerRequestsTableSkeleton;
