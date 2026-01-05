'use client';

import { ServiceCard } from './ServiceCard';
import { Button } from '@/components/ui/button';

export function ServiceGrid({ services, onServiceClick, onClearFilters }) {
  const handleServiceClick = (service) => {
    if (onServiceClick) {
      onServiceClick(service);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id || index}
            service={service}
            onClick={() => handleServiceClick(service)}
          />
        ))}
      </div>
      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-lg">No services found.</p>
          {onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="ghost"
              className="mt-4 text-[var(--primary)] font-medium hover:underline"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
