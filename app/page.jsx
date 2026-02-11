'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CategoryFilter } from '@/components/category/CategoryFilter';
import { ServiceGrid } from '@/components/service/ServiceGrid';
import { OnlineSellerFilter } from '@/components/service/OnlineSellerFilter';

function HomeContent() {
  const searchParams = useSearchParams();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [sellerFilter, setSellerFilter] = useState('all');

  useEffect(() => {
    const skillSlug = searchParams.get('skill');
    setSelectedSkill(skillSlug);
  }, [searchParams]);

  const handleServiceClick = (service) => {
    console.log('Service clicked:', service);
  };

  const handleClearFilters = () => {
    setSelectedSkill(null);
    setSellerFilter('all');
    window.history.pushState({}, '', '/');
  };

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Find Top Freelance Services</h1>
      <CategoryFilter
        selectedCategory={selectedSkill || 'All'}
        onSelectCategory={setSelectedSkill}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center gap-4 border-b border-border">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Seller status:</span>
        <OnlineSellerFilter value={sellerFilter} onChange={setSellerFilter} />
      </div>
      <ServiceGrid
        skillSlug={selectedSkill}
        sellerFilter={sellerFilter}
        onServiceClick={handleServiceClick}
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
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
