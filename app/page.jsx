'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryFilter } from '@/components/category/CategoryFilter';
import { ServiceGrid } from '@/components/service/ServiceGrid';
import { OnlineSellerFilter } from '@/components/service/OnlineSellerFilter';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [sellerFilter, setSellerFilter] = useState({ online: false, offline: false });
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const skillSlug = searchParams.get('skill');
    setSelectedSkill(skillSlug);
  }, [searchParams]);

  const handleClearFilters = () => {
    setSelectedSkill(null);
    setSellerFilter({ online: false, offline: false });
    router.push('/');
  };

  const handleCategorySelect = (value) => {
    setSelectedSkill(value === 'All' ? null : value);
  };

  return (
    <main className="min-h-screen bg-background">
      <h1 className="heading-1 sr-only">Find Top Freelance Services</h1>
      <CategoryFilter
        selectedCategory={selectedSkill || 'All'}
        onSelectCategory={handleCategorySelect}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2 flex items-center gap-4 border-b border-border">
        <OnlineSellerFilter value={sellerFilter} onChange={setSellerFilter} />
      </div>
      <ServiceGrid
        skillSlug={selectedSkill}
        sellerFilter={sellerFilter}
        searchQuery={searchQuery}
        onClearFilters={handleClearFilters}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="caption">Loading...</div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
