'use client';

import { Suspense } from 'react';
import ResetPassword from '@/components/auth/ResetPassword';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function ResetPasswordPage() {
  return (
    <div className="py-8 max-w-[500px] mx-auto flex items-center justify-center px-3">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
            <div className="w-full space-y-6">
              <Skeleton className="h-9 w-64 mx-auto" />
              <Skeleton className="h-[320px] w-full rounded-lg" />
            </div>
          </div>
        }
      >
        <Card className=" px-4 py-8 sm:px-6 lg:px-8">      <ResetPassword /></Card>
  
      </Suspense>
    </div>
  );
}

