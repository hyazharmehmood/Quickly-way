'use client';

import { useRouter } from 'next/navigation';
import Signup from '@/components/auth/Signup';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();

  const handleSignIn = () => {
    router.replace('/login');
  };

  const handlePostService = () => {
    router.replace('/post-service');
  };

  return (
    <div className="min-h-screen max-w-[500px] mx-auto flex items-center justify-center px-3">
      <Card className=" px-4 py-8 sm:px-6 lg:px-8">
      
        <Suspense
          fallback={
            <div className="w-full max-w-md space-y-4 p-4">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          }
        >
          <Signup onSignInClick={handleSignIn} onPostServiceClick={handlePostService} />
        </Suspense>
      
      </Card>
    </div>
  );
}
