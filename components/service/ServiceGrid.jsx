'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ServiceCard } from './ServiceCard';
import { OnlineSellerFilter } from './OnlineSellerFilter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';
import { HomeBanner } from '../banner/HomeBanner';
import useLocationFilterStore from '@/store/useLocationFilterStore';

const DEFAULT_PAGE_SIZE = 12;

const DEFAULT_SELLER_FILTER = { online: false, offline: false };

export function ServiceGrid({
  skillSlug,
  sellerFilter = DEFAULT_SELLER_FILTER,
  onSellerFilterChange,
  searchQuery = '',
  onServiceClick,
  onClearFilters,
}) {
  const { locationFilter } = useLocationFilterStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [skillName, setSkillName] = useState(null);

  // Filter-only location from Header (not saved to profile)
  const locationParam = !locationFilter || locationFilter === 'All location' || locationFilter === 'All World' ? '' : locationFilter.trim();
  const displayLocationFilter = locationParam ? (locationFilter.includes(',') ? locationFilter.split(',')[0].trim() : locationFilter) : null;

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

  const fetchServices = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        const params = new URLSearchParams();
        if (skillSlug) params.set('skill', skillSlug);
        if (searchQuery?.trim()) params.set('q', searchQuery.trim());
        const filterState = { ...DEFAULT_SELLER_FILTER, ...(sellerFilter || {}) };
        const onlineSelected = !!filterState.online;
        const offlineSelected = !!filterState.offline;
        let statusParam = null;
        if (onlineSelected && !offlineSelected) statusParam = 'online';
        if (offlineSelected && !onlineSelected) statusParam = 'offline';
        if (!onlineSelected && !offlineSelected) statusParam = null;
        if (statusParam) params.set('status', statusParam);
        if (locationParam) params.set('location', locationParam);
        params.set('page', targetPage.toString());
        params.set('pageSize', pageSize.toString());
        const url = `/api/services/public?${params.toString()}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
          console.error("Failed to fetch services");
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const transformed = items.map((svc) => ({
          ...svc,
          freelancerId: svc.freelancerId || svc.freelancer?.id,
          provider: {
            name: svc.freelancer?.name || "Seller",
            avatarUrl: svc.freelancer?.profileImage,
            location: svc.freelancer?.location || "Remote"
          },
          thumbnailUrl: svc.coverImage || svc.images?.[0],
          rating: svc.rating || 5.0,
          reviewCount: svc.reviewCount || 0
        }));

        setServices((prev) => (append ? [...prev, ...transformed] : transformed));
        setTotal(typeof data.total === 'number' ? data.total : transformed.length);
        setPage(data.page || targetPage);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [skillSlug, sellerFilter, searchQuery, pageSize, locationParam]
  );

  useEffect(() => {
    setPage(1);
    fetchServices(1, false);
  }, [fetchServices]);

  useEffect(() => {
    // Reset list when filters or location change so refetch shows correct results
    setServices([]);
    setTotal(0);
  }, [skillSlug, sellerFilter, searchQuery, locationParam]);

  const handleLoadMore = () => {
    if (loadingMore) return;
    fetchServices(page + 1, true);
  };

  const hasMore = services.length < total;

  const handleServiceClick = (service) => {
    if (onServiceClick) {
      onServiceClick(service);
    }
  };

  const filterState = { ...DEFAULT_SELLER_FILTER, ...(sellerFilter || {}) };
  const hasSellerFilter = filterState.online || filterState.offline;
  const hasAnyFilter = skillSlug || searchQuery || hasSellerFilter || !!locationParam;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6">
      {/* Seller dropdown + Applied filters + Results + Clear - all in one row */}
      <div className="mb-6 flex items-center gap-3 flex-wrap border-b border-border pb-4">
        {onSellerFilterChange && (
          <OnlineSellerFilter value={sellerFilter} onChange={onSellerFilterChange} />
        )}
        {searchQuery && (
          <>
            <span className="text-sm text-muted-foreground">Search:</span>
            <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20">
              {searchQuery}
            </span>
          </>
        )}
        {skillSlug && skillName && (
          <>
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20">
              {skillName}
            </span>
          </>
        )}
        {displayLocationFilter && (
          <>
            <span className="text-sm text-muted-foreground">Location:</span>
            <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium border border-primary/20">
              {displayLocationFilter}
            </span>
          </>
        )}
        {/* {hasSellerFilter && (
          <span className="px-3 py-1.5 bg-secondary rounded-md text-sm font-medium">
            {filterState.online && !filterState.offline ? 'Online sellers' : 'Offline sellers'}
          </span>
        )} */}
        <span className="text-sm text-muted-foreground flex-1 min-w-0" />
        <span className="text-sm text-muted-foreground shrink-0">
          {services.length} of {total} {total === 1 ? 'result' : 'results'}
        </span>
        {onClearFilters && hasAnyFilter && (
          <Button
            onClick={onClearFilters}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            Clear filter
          </Button>
        )}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <HomeBanner />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
        {loading && services.length === 0 ? (
          [...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
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
          ))
        ) : (
          services.map((service, index) => (
            <ServiceCard
              key={service.id || index}
              service={service}
              onClick={() => handleServiceClick(service)}
            />
          ))
        )}
      </div>
      {services.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-lg">
            {(() => {
              const f = { ...DEFAULT_SELLER_FILTER, ...(sellerFilter || {}) };
              if (f.online && !f.offline) return 'No online sellers found.';
              if (f.offline && !f.online) return 'No offline sellers found.';
              if (searchQuery) return `No services found for "${searchQuery}".`;
              return skillSlug ? `No services found for "${skillName || skillSlug}".` : 'No services found.';
            })()}
          </p>
          {onClearFilters && (skillSlug || searchQuery || sellerFilter?.online || sellerFilter?.offline || locationParam) && (
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
      {services.length > 0 && hasMore && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="min-w-[160px]"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
