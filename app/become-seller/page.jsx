'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BecomeSellerPage() {
    const router = useRouter();
    const { user, isLoggedIn, isSeller, sellerStatus, refreshProfile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [skillsInput, setSkillsInput] = useState('');
    const [bio, setBio] = useState('');
    const [portfolio, setPortfolio] = useState('');

    useEffect(() => {
        if (!isLoggedIn) {
            router.replace('/login');
            return;
        }
        // Already approved seller: can go to freelancer dashboard
        if (isSeller && sellerStatus === 'APPROVED') {
            router.replace('/dashboard/freelancer');
            return;
        }
        setPageLoading(false);
        if (user?.name) setFullName(user.name);
    }, [isLoggedIn, isSeller, sellerStatus, router, user?.name]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const skills = skillsInput.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
        if (!fullName.trim()) {
            toast.error('Please enter your full name.');
            return;
        }
        if (skills.length === 0) {
            toast.error('Please enter at least one skill (comma-separated).');
            return;
        }
        setLoading(true);
        try {
            await api.post('/seller/apply', {
                fullName: fullName.trim(),
                skills,
                bio: bio.trim() || undefined,
                portfolio: portfolio.trim() || undefined,
            });
            toast.success('Application submitted! We will review and notify you.');
            await refreshProfile();
            router.push('/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit application.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Pending: show status
    if (sellerStatus === 'PENDING') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Seller request pending</CardTitle>
                        <CardDescription>
                            Your request to become a seller is under review. You will get access to the seller dashboard once approved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/">Back to home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/"><ArrowLeft className="w-4 h-4" /></Link>
                        </Button>
                        <CardTitle>Become a seller</CardTitle>
                    </div>
                    <CardDescription>
                        Fill the form below. After admin approval you will get access to the freelancer dashboard and can create services.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Full name *</label>
                            <Input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Skills *</label>
                            <Input
                                value={skillsInput}
                                onChange={(e) => setSkillsInput(e.target.value)}
                                placeholder="e.g. Web design, Logo design, Copywriting (comma-separated)"
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Short bio about your experience"
                                className="mt-1 w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Portfolio / website</label>
                            <Input
                                type="url"
                                value={portfolio}
                                onChange={(e) => setPortfolio(e.target.value)}
                                placeholder="https://..."
                                className="mt-1"
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit request'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
