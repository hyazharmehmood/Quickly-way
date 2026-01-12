"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Send, ShieldCheck, Sparkles } from 'lucide-react';
import api from '@/utils/api';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'sonner';

const formSchema = z.object({
    fullName: z.string().min(3, "Full name is required"),
    bio: z.string().min(50, "Bio must be at least 50 characters"),
    skills: z.string().min(2, "At least one skill is required"),
    portfolio: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    agreement: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

export const BecomeSellerForm = () => {
    const { user, updateSellerStatus } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: user?.name || "",
            bio: "",
            skills: "",
            portfolio: "",
            agreement: false,
        },
    });

    const onSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const payload = {
                userId: user?._id || user?.id,
                ...values,
                skills: values.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
            };

            await api.post('/seller/apply', payload);
            updateSellerStatus('pending');
            toast.success("Application submitted! Admin will review it soon.");
        } catch (error) {
            console.error("Seller application error:", error);
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto rounded-[2.5rem] border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="p-10 bg-primary/5 border-b border-primary/10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">Become a Seller</Badge>
                </div>
                <CardTitle className="text-3xl font-normal text-foreground tracking-tight">Step into Freelancing</CardTitle>
                <CardDescription className="text-muted-foreground text-lg mt-2 font-normal">
                    Apply to join our community of professionals and start offering your services.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-10 space-y-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-normal text-foreground">Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} className="h-12 bg-secondary/30 rounded-xl border-border focus:ring-primary/20" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-normal text-foreground">Skills (Comma separated)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Next.js, Tailwind, Design, SEO" {...field} className="h-12 bg-secondary/30 rounded-xl border-border" />
                                    </FormControl>
                                    <FormDescription className="text-xs font-normal">Enter skills to help us understand your expertise.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-normal text-foreground">Professional Bio</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about your experience and what you offer..."
                                            className="min-h-[150px] bg-secondary/30 rounded-xl border-border resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="portfolio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-normal text-foreground">Portfolio Link (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://yourportfolio.com" {...field} className="h-12 bg-secondary/30 rounded-xl border-border" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="agreement"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-6 bg-secondary/20 rounded-2xl border border-border/50">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="w-5 h-5 rounded-md border-muted-foreground data-[state=checked]:bg-primary"
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-normal text-foreground cursor-pointer">
                                            I agree to the Quicklyway Terms of Service and Privacy Policy.
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground font-normal">
                                            By checking this, you verify that the information provided is accurate.
                                        </p>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 text-lg font-normal transition-all"
                        >
                            {isSubmitting ? "Submitting..." : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    <span>Submit Application</span>
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>

            <CardFooter className="p-10 pt-0 flex items-center gap-2 justify-center text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-normal">Secure verification process</span>
            </CardFooter>
        </Card>
    );
};
