"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, User, MapPin, Mail, CheckCircle2, XCircle, Loader2,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';
import { toast } from 'sonner';
import { ServiceApprovalStatusBadge } from '@/components/service/ServiceApprovalStatusBadge';

export default function AdminServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (!id) return;
        const fetchService = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/admin/services/${id}`);
                if (res.data?.success) setService(res.data.service);
                else setService(null);
            } catch {
                toast.error('Failed to load service');
                setService(null);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    const setStatus = async (action) => {
        if (!service) return;
        if (action === 'REJECT' && !rejectionReason?.trim()) {
            toast.error('Please enter a reason for rejection');
            return;
        }
        try {
            setActionLoading(true);
            const payload = action === 'REJECT'
                ? { action: 'REJECT', rejectionReason: rejectionReason?.trim() || 'No reason provided' }
                : { action: action === 'APPROVED' ? 'APPROVE' : action };
            const res = await api.patch(`/admin/services/${service.id}/status`, payload);
            if (res.data?.success) {
                toast.success(action === 'REJECTED' ? 'Service rejected' : action === 'APPROVED' ? 'Service approved' : 'Set to requested');
                setService((prev) => prev ? { ...prev, approvalStatus: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : action, rejectionReason: action === 'REJECT' ? (rejectionReason?.trim() || 'No reason provided') : null } : null);
                if (action === 'REJECT') setRejectionReason('');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-56 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="space-y-4">
                <Link href="/admin/services" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to services
                </Link>
                <Card><CardContent className="py-12 text-center text-muted-foreground">Service not found.</CardContent></Card>
            </div>
        );
    }

    const galleryUrls = [
        service.coverImage,
        ...(service.images || [])
    ].filter(Boolean);
    const galleryLength = galleryUrls.length;
    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % galleryLength);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + galleryLength) % galleryLength);

    const skills = (service.skills || []).map((s) => s.skill?.name).filter(Boolean);
    const f = service.freelancer || {};

    return (
        <div className="space-y-4">
            <Link
                href="/admin/services"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to services
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Seller + content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Seller card */}
                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                            <div className="shrink-0">
                                {f.profileImage ? (
                                    <img src={f.profileImage} alt="" className="w-24 h-24 rounded-full object-cover border border-border" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full border border-border bg-muted flex items-center justify-center">
                                        <User className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-lg">{f.name || '—'}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{f.email || '—'}</span>
                                </div>
                                {f.location && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        <span>{f.location}</span>
                                    </div>
                                )}
                                {f.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{f.bio}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Title */}
                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4 md:p-6">
                            <h1 className="text-xl font-semibold">{service.title}</h1>
                        </CardContent>
                    </Card>

                    {/* Gallery */}
                    {galleryLength > 0 && (
                        <Card className="border border-border shadow-sm">
                            <CardContent className="p-4 md:p-6">
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                                    {service.coverType === 'TEXT' && currentImageIndex === 0 && service.coverText ? (
                                        <div className={`w-full  h-full ${service.coverColor || 'bg-muted'} flex items-center justify-center p-8 !px-14 text-center`}>
                                            <span className="font-bold text-4xl text-foreground text-white ">{service.coverText}</span>
                                        </div>
                                    ) : (
                                        <Image
                                            src={galleryUrls[currentImageIndex]}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                    <button type="button" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white">
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button type="button" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white">
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                    {galleryUrls.map((url, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 ${currentImageIndex === idx ? 'border-primary' : 'border-transparent'}`}
                                        >
                                            <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Description */}
                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4 md:p-6">
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{service.description || '—'}</p>
                        </CardContent>
                    </Card>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <Card className="border border-border shadow-sm">
                            <CardContent className="p-4 md:p-6">
                                <h3 className="font-semibold mb-2">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((name, i) => (
                                        <Badge key={i} variant="secondary">{name}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Price + Admin actions */}
                <div className="space-y-4">
                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4 md:p-6">
                            <h3 className="font-semibold mb-2">Starting price</h3>
                            <p className="text-xl font-semibold">{service.currency || '$'}{service.price ?? '—'}</p>
                        </CardContent>
                    </Card>

                    {/* Admin actions: Approve, Reject, Reason */}
                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4 md:p-6 space-y-4">
                            <h3 className="font-semibold">Admin actions</h3>
                            <div className="flex items-center gap-2">
                                <Label className="text-muted-foreground text-sm">Status</Label>
                                <ServiceApprovalStatusBadge status={service.approvalStatus} />
                            </div>
                            {service.approvalStatus === 'REJECTED' && service.rejectionReason && (
                                <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                                    <Label className="text-muted-foreground text-xs">Rejection reason</Label>
                                    <p className="text-sm text-destructive mt-1">{service.rejectionReason}</p>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={service.approvalStatus === 'APPROVED' ? 'default' : 'outline'}
                                    onClick={() => setStatus('APPROVE')}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                    Approved
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setStatus('REJECT')}
                                    disabled={actionLoading}
                                >
                                    <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                            </div>
                            <div>
                                <Label htmlFor="admin-rejection-reason" className="text-sm">Reason (for rejection – seller will see this)</Label>
                                <Textarea
                                    id="admin-rejection-reason"
                                    placeholder="Enter reason when rejecting..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="mt-2 min-h-[80px]"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Required when you click Reject.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
