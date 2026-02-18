'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Star, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserStatus } from '@/components/chat/UserStatus';

export function ServiceCard({ service }) {
  const router = useRouter();
  console.log('service', service);
  const [avatarError, setAvatarError] = useState(false);
  
  // Handle potentially missing nested data if the API structure varies
  const provider = service.provider || {
    avatarUrl: service.profileImage,
    name: service.name,
    location: service.location,
  };

  const thumbnailUrl = service.thumbnailUrl || service.image;
  const reviewCount =
    typeof service.reviewCount === 'number'
      ? service.reviewCount
      : Array.isArray(service.reviews)
        ? service.reviews.length
        : 0;
  const rating = typeof service.rating === 'number' ? service.rating : 5.0;

  const handleCardClick = () => {
    router.push(`/services/${service.id}`);
  };

  return (
    <Card 
      className="cursor-pointer border-none shadow-none transition-transform duration-300 hover:-translate-y-1 h-full"
      onClick={handleCardClick}
    >
        {/* Media Container - Changed aspect ratio to 11/7 to match editor (220/140) */}
        <div className="relative aspect-[11/7] overflow-hidden rounded-xl bg-black">
          {service.coverType === 'TEXT' ? (
            <div className={`w-full h-full ${service.coverColor || 'bg-black'} flex items-center justify-center p-6 text-center`}>
              <span className="text-white font-bold text-2xl leading-tight line-clamp-4 break-words" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {service.coverText || service.title || 'Service'}
              </span>
            </div>
          ) : (
            <Image
              src={service.coverImage || thumbnailUrl}
              alt={service.title || service.description}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>

        {/* Content */}
        <CardContent className="py-4 px-0 flex flex-col flex-grow px-2">

          {/* Provider Header */}
          <div className="flex items-start gap-2 mb-3">
            <Link 
              href={`/freelancer/${service.freelancerId || service.freelancer?.id}`}
              onClick={(e) => e.stopPropagation()}
              className="relative flex-shrink-0"
            >
              {provider.avatarUrl && provider.avatarUrl.trim() !== '' && !avatarError ? (
                <Image
                  src={provider.avatarUrl}
                  alt={provider.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0 hover:ring-2 ring-primary/20 transition-all cursor-pointer"
                  onError={() => setAvatarError(true)}
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 hover:ring-2 ring-primary/20 transition-all cursor-pointer">
                  <User className="w-5 h-5 text-primary/60" />
                </div>
              )}
              {/* Online Status Indicator */}
              {service.freelancerId && (
                <div className="absolute bottom-[0.125rem] right-0.5">
                  <UserStatus userId={service.freelancerId} size="sm" />
                </div>
              )}
            </Link>
            <div className="flex flex-col gap-0.5">
              <Link 
                href={`/freelancer/${service.freelancerId || service.freelancer?.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-base  font-semibold text-gray-900 leading-tight hover:text-primary transition-colors cursor-pointer"
              >
                {provider.name}
              </Link>
              <div className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 active:text-gray-900 transition-colors min-h-[1.25rem]">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{provider.location || 'Remote'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4 hover:text-gray-900 active:text-gray-900 transition-colors">
            {service.description || service.title || ''}
          </p>

          {/* Footer: Rating and Price */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-base font-semibold text-gray-900">{rating.toFixed(1)}</span>
              <span className="text-base text-gray-400 hover:text-gray-600 active:text-gray-900 transition-colors">({reviewCount})</span>
            </div>
            <div className="text-base font-semibold text-gray-900">
              {service.currency === 'USD' || !service.currency ? (
                <>${Number(service.price).toFixed(0)}</>
              ) : (
                <>{service.currency} {Number(service.price).toFixed(0)}</>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
