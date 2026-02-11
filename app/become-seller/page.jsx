'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Shield, Sparkles, Star } from 'lucide-react';
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

    const skillsPreview = skillsInput
        .split(/[,،]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);

        const highlights = [
            {
                icon: <Shield className="w-4 h-4" />,
                title: 'Trusted & Verified',
                desc: 'All sellers go through a manual review process to maintain platform quality and trust.',
            },
            {
                icon: <Sparkles className="w-4 h-4" />,
                title: 'Advanced Seller Tools',
                desc: 'Manage orders, chat with clients in real-time, send offers, and track performance easily.',
            },
            {
                icon: <Star className="w-4 h-4" />,
                title: 'Build Your Reputation',
                desc: 'Collect reviews, grow your ratings, and build a strong freelance brand over time.',
            },
        ];

    return (
        <div className=" pt-6 pb-10 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col gap-4">
                  
                    <div className="flex flex-col ">
                     
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground">
    Apply to Become a Verified Seller
</h1>
<p className="text-muted-foreground max-w-3xl text-xs">
    Complete your seller application to join our trusted freelance marketplace. 
    Our team carefully reviews every profile to ensure high-quality services for buyers. 
    Once approved, you’ll unlock your seller dashboard and can start publishing services right away.
</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <Card className="border-none shadow-sm bg-card/95 backdrop-blur">
                        <CardHeader className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                {highlights.map((item) => (
                                    <div key={item.title} className="flex flex-col gap-1.5 rounded-xl border border-border/60 p-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                        <p className="text-sm font-semibold">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <CardTitle className="text-lg">Why Become a Seller?</CardTitle>
<CardDescription className="text-xs">
    As a verified seller, you gain access to powerful tools designed to help you succeed. 
    From secure payments to performance analytics, everything is built to support your freelance growth.
</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                        <ul className="space-y-2 text-xs text-muted-foreground">
    <li>• Verified seller badge displayed on your profile</li>
    <li>• Ability to create and manage unlimited services</li>
    <li>• Secure order management & dispute handling system</li>
    <li>• Access to performance insights and client reviews</li>
</ul>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-none">
                        <CardHeader>
                        <CardTitle>Seller Application</CardTitle>
<CardDescription>
    Your information is securely reviewed by our admin team. 
    This data will not be publicly visible until your application is approved.
</CardDescription> </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Full name *</label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. Ayesha Khan"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
    Professional Skills *
</label>  <Input
                                        value={skillsInput}
                                        onChange={(e) => setSkillsInput(e.target.value)}
                                        placeholder="e.g. UI/UX, Next.js, Brand identity"
                                        required
                                    />
                                    {skillsPreview.length > 0 && (
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {skillsPreview.map((skill) => (
                                                <Badge key={skill} variant="secondary">{skill}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Bio</label>
                                    <Textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Briefly describe your professional experience, expertise, certifications, or notable achievements"

                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Portfolio / website</label>
                                    <Input
                                        type="url"
                                        value={portfolio}
                                        onChange={(e) => setPortfolio(e.target.value)}
                                        placeholder="https://yourportfolio.com or https://dribbble.com/username"

                                    />
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application for Review'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
