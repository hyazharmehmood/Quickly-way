'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CategoryFilter } from '@/components/category/CategoryFilter';
import { ServiceGrid } from '@/components/service/ServiceGrid';

function HomeContent() {
  const searchParams = useSearchParams();
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    // Get skill from URL query parameter
    const skillSlug = searchParams.get('skill');
    setSelectedSkill(skillSlug);
  }, [searchParams]);

  const handleServiceClick = (service) => {
    // TODO: Navigate to service detail page
    console.log('Service clicked:', service);
  };

  const handleClearFilters = () => {
    setSelectedSkill(null);
    // Clear URL parameter
    window.history.pushState({}, '', '/');
  };

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Find Top Freelance Services</h1>
      <CategoryFilter
        selectedCategory={selectedSkill || 'All'}
        onSelectCategory={setSelectedSkill}
      />
      <ServiceGrid
        skillSlug={selectedSkill}
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
