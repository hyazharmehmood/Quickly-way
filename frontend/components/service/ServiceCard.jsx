'use client';

import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';

export function ServiceCard({ service, onClick }) {
  const {
    thumbnailUrl,
    image,
    provider,
    title,
    description,
    rating,
    reviewCount,
    reviews,
    price,
  } = service;

  // Handle both old and new data structure
  const serviceImage = thumbnailUrl || image;
  const providerData = provider || {
    avatarUrl: service.profileImage,
    name: service.name,
    location: service.location,
  };
  const serviceTitle = title || description;
  const serviceDescription = description;
  const serviceRating = rating;
  const serviceReviews = reviewCount || reviews;
  const servicePrice = price;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-card rounded-none sm:rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Media Container - aspect ratio 11/7 */}
      <div className="relative aspect-[11/7] overflow-hidden rounded-xl bg-background">
        <Image
          src={serviceImage}
          alt={serviceTitle}
          fill
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="py-4 flex flex-col flex-grow">
        {/* Provider Header */}
        <div className="flex items-start gap-3 mb-3">
          <Image
            src={providerData.avatarUrl}
            alt={providerData.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border border-[var(--gray-100)] flex-shrink-0"
          />
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-foreground leading-tight">
              {providerData.name}
            </h3>
            <div className="flex items-center gap-1 text-base text-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{providerData.location}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-lg text-[var(--description-text)] leading-relaxed line-clamp-2 mb-4">
          {serviceDescription}
        </p>

        {/* Footer: Rating and Price */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="w-5 h-5 fill-[var(--rating-star)] text-[var(--rating-star)]" />
            <span className="text-base font-bold text-foreground">{serviceRating}</span>
            <span className="text-base text-[var(--review-count)]">
              ({serviceReviews})
            </span>
          </div>
          <div className="text-lg font-bold text-foreground">
            ${servicePrice}
          </div>
        </div>
      </div>
    </div>
  );
}
