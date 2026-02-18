'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BecomeSellerPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/join-as-freelancer');
  }, [router]);
  return null;
}
