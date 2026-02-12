'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, CheckCircle } from 'lucide-react';

export default function SupportPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/support/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, description }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to send message.');
                return;
            }
            setSent(true);
            setName('');
            setEmail('');
            setDescription('');
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h3 className="heading-3 ">Help & Support</h3>
                <p className="text-muted-foreground font-normal mb-8 text-sm">
                    Have a question or feedback? Send us a message and we’ll get back to you.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Us</CardTitle>
                        <CardDescription>
                            Enter your name, email and message. We’ll reply to your email.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CheckCircle className="h-12 w-12 text-primary mb-4" />
                                <p className="text-lg font-medium text-foreground">Message sent</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We’ll get back to you at your email soon.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-6"
                                    onClick={() => setSent(false)}
                                >
                                    Send another message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Message</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="How can we help?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        disabled={loading}
                                        rows={5}
                                        className="w-full resize-none"
                                    />
                                </div>
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send message
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
                    <Card className="border hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Getting Started</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground">
                                Learn the basics of using Quicklyway.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Account & Billing</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-sm text-muted-foreground">
                                Manage your account settings and payments.
                            </p>
                        </CardContent>
                    </Card>
                </div> */}
            </div>
        </div>
    );
}
