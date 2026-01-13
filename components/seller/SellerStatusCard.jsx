"use client";

import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, XCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const SellerStatusCard = ({ status, reason, onRetry }) => {
    const isPending = status === 'pending';
    const isRejected = status === 'rejected';

    return (
        <Card className="max-w-xl mx-auto rounded-[2.5rem] border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="p-10 text-center">
                <div className="flex justify-center mb-6">
                    {isPending ? (
                        <div className="w-20 h-20 rounded-[2.5rem] bg-orange-100 flex items-center justify-center text-orange-600 animate-pulse">
                            <Clock className="w-10 h-10" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-[2.5rem] bg-destructive/10 flex items-center justify-center text-destructive">
                            <XCircle className="w-10 h-10" />
                        </div>
                    )}
                </div>
                <CardTitle className="text-3xl font-normal text-foreground tracking-tight">
                    {isPending ? "Application Pending" : "Application Rejected"}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-lg mt-3 font-normal">
                    {isPending
                        ? "Our team is currently reviewing your seller application. This usually takes 24-48 hours."
                        : "We're sorry, but your application was not approved at this time."}
                </CardDescription>
            </CardHeader>

            <CardContent className="px-10 pb-10">
                {isRejected && (
                    <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-2xl mb-8">
                        <div className="flex items-center gap-2 mb-2 text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">Reason for rejection</span>
                        </div>
                        <p className="text-foreground font-normal italic">
                            "{reason || "No specific reason provided. Please ensure your profile is complete and professional."}"
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {isRejected ? (
                        <Button
                            onClick={onRetry}
                            className="h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Update & Resubmit
                        </Button>
                    ) : (
                        <Button asChild variant="outline" className="h-14 border-border rounded-2xl bg-secondary/30">
                            <Link href="/">
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back to Home
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-8 bg-secondary/10 border-t border-border flex justify-center">
                <p className="text-xs text-muted-foreground font-normal">
                    Need help? <Link href="/support" className="text-primary hover:underline">Contact Support</Link>
                </p>
            </CardFooter>
        </Card>
    );
};
