'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function ServiceCard({ service }) {
  // Handle potentially missing nested data if the API structure varies
  const provider = service.provider || {
    avatarUrl: service.profileImage,
    name: service.name,
    location: service.location,
  };

  const thumbnailUrl = service.thumbnailUrl || service.image;
  const reviewCount = service.reviewCount || service.reviews;

  return (
    <Link href={`/service/${service.id}`} className="block h-full transition-transform duration-300 hover:-translate-y-1">
      <Card className="">
        {/* Media Container - Changed aspect ratio to 11/7 to match editor (220/140) */}
        <div className="relative aspect-[11/7] overflow-hidden rounded-xl bg-black">
          <Image
            src={thumbnailUrl}
            alt={service.title || service.description}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <CardContent className="py-4 px-0 flex flex-col flex-grow px-2">

          {/* Provider Header */}
          <div className="flex items-start gap-3 mb-3">
            <Image
              src={provider.avatarUrl}
              alt={provider.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0"
            />
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                {provider.name}
              </h3>
              <div className="flex items-center gap-1 text-base text-gray-500 mt-1 hover:text-gray-900 active:text-gray-900 transition-colors">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{provider.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed line-clamp-2 mb-4 hover:text-gray-900 active:text-gray-900 transition-colors">
            {service.description}
          </p>

          {/* Footer: Rating and Price */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-base font-bold text-gray-900">{service.rating}</span>
              <span className="text-base text-gray-400 hover:text-gray-600 active:text-gray-900 transition-colors">({reviewCount})</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              ${service.price}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
