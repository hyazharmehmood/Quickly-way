'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/utils';
import api from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';

// Dimensions match admin recommended (1200×200 desktop, 768×140 mobile)
const DESKTOP_ASPECT = 1200 / 200;  // 6:1
const MOBILE_ASPECT = 768 / 140;    // ~5.49:1
const BREAKPOINT = 768;

export function HomeBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);
    const updateDevice = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      const device = mobile ? 'MOBILE' : 'DESKTOP';
      fetchBanners(device);
    };
    updateDevice();
    mq.addEventListener('change', updateDevice);
    return () => mq.removeEventListener('change', updateDevice);
  }, []);

  const fetchBanners = async (device) => {
    try {
      setLoading(true);
      const params = device ? `?device=${device}` : '';
      const res = await api.get(`/banners${params}`);
      if (res.data?.success && Array.isArray(res.data.banners)) {
        setBanners(res.data.banners);
      } else {
        setBanners([]);
      }
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full mb-6">
        <Skeleton
          className="w-full rounded-xl overflow-hidden bg-primary/10"
          style={{ aspectRatio: DESKTOP_ASPECT }}
        />
      </div>
    );
  }

  if (banners.length === 0) return null;

  const aspect = isMobile ? MOBILE_ASPECT : DESKTOP_ASPECT;
  const isTwoOrMore = banners.length >= 2;

  return (
    <div
      className={cn(
        'w-full mb-6',
        isTwoOrMore ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''
      )}
    >
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={cn(
            'block w-full overflow-hidden rounded-xl bg-muted ',
            isTwoOrMore && 'min-w-0'
          )}
        >
          <div
            className="relative w-full overflow-hidden flex items-center justify-center bg-muted/30"
            style={{ aspectRatio: aspect }}
          >
            <img
              src={banner.imageUrl || ''}
              alt={banner.title || 'Promotional banner'}
              className="w-full h-full object-contain object-center"
              loading="eager"
              decoding="async"
              sizes={isMobile ? '100vw' : isTwoOrMore ? '50vw' : '1280px'}
              fetchPriority="high"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
