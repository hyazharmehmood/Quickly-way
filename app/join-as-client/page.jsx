'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';
import Link from 'next/link';

const CLIENT_AGREEMENT = `
CLIENT AGREEMENT – QUICKLYWAY

1. Acceptance
By joining as a Client on Quicklyway, you agree to use the platform to request, purchase, and receive services from Sellers in accordance with these terms and our general Terms of Service. Clients may engage Sellers across all supported professions and service types offered on the platform.

2. Your responsibilities
• You will provide clear, accurate requirements and communicate in good faith with Sellers.
• You will pay for orders as per the agreed price and platform payment terms.
• You will not use the platform for any illegal or prohibited purpose.

3. Orders and payments
• Payments are processed through the platform. Refunds and cancellations are subject to our policies and any applicable dispute process.
• You may open a dispute if you believe a delivery does not meet the agreement; admin may assist in resolution.

4. Conduct
• You must not harass Sellers, share false information, or attempt to transact outside the platform to avoid fees.
• Violation may result in suspension or loss of client access.

5. Changes
We may update this agreement; continued use after changes constitutes acceptance. For major changes we will notify you where required.

By checking "I agree" and submitting, you confirm that you have read, understood, and agree to this Client Agreement.
`.trim();

export default function JoinAsClientPage() {
  const router = useRouter();
  const { user, isLoggedIn, refreshProfile } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    checkMyRequests();
  }, [isLoggedIn, router]);

  const checkMyRequests = async () => {
    try {
      const res = await api.get('/role-agreement-requests/my');
      if (res.data?.success && res.data.requests?.length) {
        const clientReq = res.data.requests.find((r) => r.requestedRole === 'CLIENT');
        if (clientReq?.status === 'PENDING') setPendingRequest(true);
        if (clientReq?.status === 'APPROVED') {
          router.replace('/');
          return;
        }
      }
    } catch (_) {}
    setPageLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast.error('Please check the box to agree to the agreement.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/role-agreement-requests', { requestedRole: 'CLIENT', agreed: true });
      if (res.data?.success) {
        toast.success('Request submitted. You will be notified once admin approves.');
        await refreshProfile();
        setPendingRequest(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request.');
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

  if (pendingRequest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Request pending</CardTitle>
            <CardDescription>
              Your request to join as a client is under review. You will be notified once approved.
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
    <div className="pt-6 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-sm border-none rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Join as Client
            </CardTitle>
            <CardDescription>
              Read the client agreement below. By agreeing and submitting, your request will be sent to admin for approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-muted/50 border border-border p-4 max-h-[320px] overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{CLIENT_AGREEMENT}</pre>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(!!v)}
                  className="mt-0.5"
                />
                <label htmlFor="agree" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  I have read and agree to the Client Agreement above.
                </label>
              </div>

              <Button type="submit" disabled={loading || !agreed} className="w-full rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
