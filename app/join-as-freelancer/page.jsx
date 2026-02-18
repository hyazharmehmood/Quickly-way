'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Loader2, FileText, Store } from 'lucide-react';
import Link from 'next/link';

const SELLER_AGREEMENT = `
SELLER (FREELANCER) AGREEMENT – QUICKLYWAY

1. Acceptance
By joining as a Seller on Quicklyway, you agree to offer and deliver services to Clients in accordance with these terms and our general Terms of Service.

2. Your responsibilities
• You will provide accurate service descriptions, delivery times, and pricing.
• You will deliver work as described and respond to messages and revision requests in good faith.
• You will not use the platform for any illegal or prohibited purpose.

3. Orders and payments
• You will receive payment through the platform according to our payout and fee policies. You must not request or accept payment outside the platform for work arranged on Quicklyway.
• Disputes may be raised by Clients; admin may assist in resolution. You agree to cooperate with any fair resolution process.

4. Conduct
• You must not harass Clients, misrepresent your skills or deliverables, or attempt to take work off the platform.
• Violation may result in suspension or loss of seller access.

5. Changes
We may update this agreement; continued use after changes constitutes acceptance. For major changes we will notify you where required.

By checking "I agree" and submitting, you confirm that you have read, understood, and agree to this Seller Agreement.
`.trim();

export default function JoinAsFreelancerPage() {
  const router = useRouter();
  const { user, isLoggedIn, isSeller, sellerStatus, refreshProfile } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (isSeller && sellerStatus === 'APPROVED') {
      router.replace('/dashboard/freelancer');
      return;
    }
    checkMyRequests();
  }, [isLoggedIn, isSeller, sellerStatus, router]);

  const checkMyRequests = async () => {
    try {
      const res = await api.get('/role-agreement-requests/my');
      if (res.data?.success && res.data.requests?.length) {
        const sellerReq = res.data.requests.find((r) => r.requestedRole === 'FREELANCER');
        if (sellerReq?.status === 'PENDING') setPendingRequest(true);
        if (sellerReq?.status === 'APPROVED') {
          router.replace('/dashboard/freelancer');
          return;
        }
      }
      if (sellerStatus === 'PENDING') setPendingRequest(true);
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
      const res = await api.post('/role-agreement-requests', { requestedRole: 'FREELANCER', agreed: true });
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
              Your request to join as a seller is under review. You will get access to the seller dashboard once approved.
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
              <Store className="h-5 w-5" />
              Join as Seller
            </CardTitle>
            <CardDescription>
              Read the seller agreement below. By agreeing and submitting, your request will be sent to admin for approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-muted/50 border border-border p-4 max-h-[320px] overflow-y-auto">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{SELLER_AGREEMENT}</pre>
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
                  I have read and agree to the Seller Agreement above.
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
