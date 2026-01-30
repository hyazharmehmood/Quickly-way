'use client';

import React, { useState, useEffect } from 'react';
import { ServiceCard } from './ServiceCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';

export function ServiceGrid({ skillSlug, onServiceClick, onClearFilters }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillName, setSkillName] = useState(null);

  useEffect(() => {
    // Fetch skill name if skillSlug is provided (for display purposes only)
    const fetchSkillName = async (slug) => {
      try {
        // We need to find the skill by slug - let's search through categories
        const categoriesRes = await api.get('/categories?includeChildren=true&includeSkills=true');
        if (categoriesRes.data.success) {
          const categories = categoriesRes.data.categories || [];
          for (const category of categories) {
            // Check subcategories
            if (category.children) {
              for (const subcategory of category.children) {
                if (subcategory.skills) {
                  const skill = subcategory.skills.find(s => s.slug === slug);
                  if (skill) {
                    setSkillName(skill.name);
                    return;
                  }
                }
              }
            }
            // Check main category skills
            if (category.skills) {
              const skill = category.skills.find(s => s.slug === slug);
              if (skill) {
                setSkillName(skill.name);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching skill name:', error);
      }
    };

    if (skillSlug) {
      fetchSkillName(skillSlug);
    } else {
      setSkillName(null);
    }
  }, [skillSlug]);

  useEffect(() => {
    // Fetch public services
    const fetchServices = async () => {
      try {
        setLoading(true);
        // Build URL with skillSlug query parameter if provided
        const url = skillSlug 
          ? `/api/services/public?skill=${encodeURIComponent(skillSlug)}`
          : '/api/services/public';
        
        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          console.log("Services data:", data.length, "services");
          
          // Reviews are now included in the API response (optimized - no separate API calls)
          const transformed = data.map((svc) => ({
            ...svc,
            freelancerId: svc.freelancerId || svc.freelancer?.id,
            provider: {
              name: svc.freelancer?.name || "Freelancer",
              avatarUrl: svc.freelancer?.profileImage,
              location: "Remote"
            },
            thumbnailUrl: svc.coverImage || svc.images?.[0],
            rating: svc.rating || 5.0,
            reviewCount: svc.reviewCount || 0
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
  }, [skillSlug]);

  const handleServiceClick = (service) => {
    if (onServiceClick) {
      onServiceClick(service);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
      {/* Active Filter Indicator */}
      {skillSlug && skillName && (
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20">
              {skillName}
            </span>
            <span className="text-sm text-muted-foreground">
              {services.length} {services.length === 1 ? 'result' : 'results'}
            </span>
          </div>
          {onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id || index}
            service={service}
            onClick={() => handleServiceClick(service)}
          />
        ))}
      </div>
      {services.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-lg">
            {skillSlug ? `No services found for "${skillName || skillSlug}".` : 'No services found.'}
          </p>
          {onClearFilters && skillSlug && (
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
