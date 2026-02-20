'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryFilter } from '@/components/category/CategoryFilter';
import { ServiceGrid } from '@/components/service/ServiceGrid';
import { HomeBanner } from '@/components/banner/HomeBanner';
import useLocationFilterStore from '@/store/useLocationFilterStore';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearLocationFilter } = useLocationFilterStore();
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
    clearLocationFilter();
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
    
      <ServiceGrid
        skillSlug={selectedSkill}
        sellerFilter={sellerFilter}
        onSellerFilterChange={setSellerFilter}
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
