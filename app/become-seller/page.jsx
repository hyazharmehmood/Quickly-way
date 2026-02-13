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
import { Loader2 } from 'lucide-react';
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
    const [errors, setErrors] = useState({});

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

    const validate = () => {
        const next = {};
        if (!fullName.trim()) next.fullName = 'Full name is required.';
        const skills = skillsInput.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
        if (skills.length === 0) next.skills = 'Please enter at least one skill (comma-separated).';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            toast.error('Please fill all required fields.');
            return;
        }
        const skills = skillsInput.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
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

    return (
        <div className="pt-6 pb-10 px-4">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-sm border-none">
                    <CardHeader>
                        <CardTitle>Seller Application</CardTitle>
                        {/* <CardDescription>
                            Your information is securely reviewed by our admin team.
                            This data will not be publicly visible until your application is approved.
                        </CardDescription> */}
                    </CardHeader>
                    <CardContent>
                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Full name *</label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => {
                                            setFullName(e.target.value);
                                            if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' }));
                                        }}
                                        placeholder="Enter your full name"
                                        className={errors.fullName ? 'border-destructive' : ''}
                                    />
                                    {errors.fullName && (
                                        <p className="text-xs text-destructive">{errors.fullName}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Professional Skills *</label>
                                    <Input
                                        value={skillsInput}
                                        onChange={(e) => {
                                            setSkillsInput(e.target.value);
                                            if (errors.skills) setErrors((p) => ({ ...p, skills: '' }));
                                        }}
                                        placeholder="Enter your skills"
                                        className={errors.skills ? 'border-destructive' : ''}
                                    />
                                    {errors.skills && (
                                        <p className="text-xs text-destructive">{errors.skills}</p>
                                    )}
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
                                        placeholder="https://yourportfolio.com"

                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !fullName.trim() || !skillsInput.trim().replace(/[,،\s]/g, '')}
                                    className="w-full"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application for Review'}
                                </Button>
                            </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
