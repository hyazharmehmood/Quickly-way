'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { CategoryFilter } from '@/components/category/CategoryFilter';
import { ServiceGrid } from '@/components/service/ServiceGrid';

// Mock data - replace with API call later
const mockServices = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    name: 'Robert Martinez',
    location: 'Barcelona, Spain',
    description: 'Expert assistance in Yoga and related fields. Dedicated to high quality results.',
    rating: 4.7,
    reviews: 71,
    price: 129,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    name: 'Jennifer White',
    location: 'Dublin, Ireland',
    description: 'Expert assistance in Logo Design and related fields. Dedicated to high quality results.',
    rating: 4.8,
    reviews: 79,
    price: 141,
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    name: 'William Brown',
    location: 'Austin, USA',
    description: 'Expert assistance in Cleaning and related fields. Dedicated to high quality results.',
    rating: 4.9,
    reviews: 87,
    price: 153,
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    name: 'Sophie Clark',
    location: 'Melbourne, Australia',
    description: 'Expert assistance in Web Dev and related fields. Dedicated to high quality results.',
    rating: 4.0,
    reviews: 95,
    price: 165,
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    name: 'Ehab Alamri',
    location: 'Jubail, Saudi Arabia',
    description: 'We are a specialized firm in urban and landscape design, Master planning, and related fields.',
    rating: 4.6,
    reviews: 328,
    price: 345,
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    name: 'Sarah Jenkins',
    location: 'Manhattan, New York',
    description: 'Expert assistance in Plumber and related fields. Dedicated to high quality results.',
    rating: 4.0,
    reviews: 15,
    price: 45,
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    name: 'Michael Chen',
    location: 'Texas, USA',
    description: 'Expert assistance in AI and related fields. Dedicated to high quality results.',
    rating: 4.1,
    reviews: 23,
    price: 57,
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    name: 'Emma Wilson',
    location: 'Sydney, Australia',
    description: 'Expert assistance in Electrician and related fields. Dedicated to high quality results.',
    rating: 4.2,
    reviews: 31,
    price: 69,
  },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter services based on selected category and search query
  const filteredServices = mockServices.filter((service) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      service.description.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleServiceClick = (service) => {
    // TODO: Navigate to service detail page
    console.log('Service clicked:', service);
  };

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
  };

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Find Top Freelance Services</h1>
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <ServiceGrid
        services={filteredServices}
        onServiceClick={handleServiceClick}
        onClearFilters={handleClearFilters}
      />
    </main>
  );
}
