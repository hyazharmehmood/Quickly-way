'use client';

import React, { useState, useEffect } from 'react';
import { ServiceCard } from './ServiceCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function ServiceGrid({onServiceClick, onClearFilters }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   
    // Otherwise, fetch public services
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services/public');
        if (res.ok) {
          const data = await res.json();
          // Transform data to match ServiceCard expectation
          const transformed = data.map(svc => ({
            ...svc,
            provider: {
              name: svc.freelancer?.name || "Freelancer",
              avatarUrl: svc.freelancer?.profileImage,
              location: "Remote" // TODO: Add location to User model
            },
            thumbnailUrl: svc.coverImage || svc.images?.[0],
            rating: 5.0, // Placeholder
            reviewCount: 0 // Placeholder
          }));
          setServices(transformed);
        } else {
          console.error("Failed to fetch services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleServiceClick = (service) => {
    if (onServiceClick) {
      onServiceClick(service);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
              {/* Aspect Ratio 11/7 match ServiceCard */}
              <Skeleton className="w-full aspect-[11/7] rounded-xl" />
              <div className="space-y-2 px-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
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
              className="mt-4 text-primary font-medium hover:underline"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
