'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Home,
  RefreshCw,
  MapPin,
  Globe,
  Headphones,
  Search,
} from 'lucide-react';
import { cn } from '@/utils';

export function Header({ searchQuery: externalSearchQuery, onSearchChange }) {
  const router = useRouter();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('All Locations');
  const displayLocation = currentLocation;
  
  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const handleNavigate = (path) => {
    router.push(`/${path}`);
  };

  const handleSearch = (value) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }
  };

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    setIsLocationPickerOpen(false);
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Top Bar */}
      <div className="bg-background border-b border-border py-2.5 px-4 sm:px-6 lg:px-8 relative z-[60]">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-start gap-8">
          {/* Navigation Icons Group */}
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate('')}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Go home"
            >
              <Home className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Refresh page"
            >
              <RefreshCw className="w-6 h-6" />
            </Button>
          </div>

          {/* Location Picker */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setIsLocationPickerOpen(!isLocationPickerOpen)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground h-auto p-0"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm sm:text-base font-normal tracking-wide">
                {displayLocation}
              </span>
            </Button>
            {/* TODO: Add LocationPicker component */}
            {isLocationPickerOpen && (
              <div className="absolute top-full mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 z-50 min-w-[200px]">
                <div className="space-y-2">
                  <button
                    onClick={() => handleLocationChange('All Locations')}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm text-popover-foreground"
                  >
                    All Locations
                  </button>
                  <button
                    onClick={() => handleLocationChange('New York')}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm text-popover-foreground"
                  >
                    New York
                  </button>
                  <button
                    onClick={() => handleLocationChange('Los Angeles')}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm text-popover-foreground"
                  >
                    Los Angeles
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Utility Buttons: Language & Support */}
          <div className="ml-auto flex items-center gap-6">
            {/* Admin Selector */}
            <Button
              variant="ghost"
              onClick={() => handleNavigate('admin')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground h-auto p-0"
              aria-label="Admin access"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm sm:text-base font-normal tracking-wide">Admin</span>
            </Button>

            {/* Support Button */}
            <Button
              variant="ghost"
              onClick={() => handleNavigate('support')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground h-auto p-0"
            >
              <Headphones className="w-4 h-4" />
              <span className="text-sm sm:text-base font-normal tracking-wide">Support</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start md:min-w-[200px]">
            <Button
              variant="ghost"
              onClick={() => handleNavigate('')}
              className="text-2xl font-bold tracking-tight text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors h-auto p-0"
            >
              Quicklyway
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 w-full flex justify-center px-0 md:px-4">
            <div className="relative group w-full max-w-2xl">
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-6 pr-12 py-3 bg-background border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-[var(--input-focus)] transition-all shadow-sm text-lg text-foreground placeholder-muted-foreground h-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted h-auto w-auto p-2"
              >
                <Search className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end md:min-w-[200px]">
            <Button
              variant="ghost"
              onClick={() => handleNavigate('login')}
              className="text-sm font-medium text-foreground hover:text-muted-foreground hover:bg-muted px-4 py-2.5 rounded-full h-auto"
            >
              Log in
            </Button>
            <Button
              onClick={() => handleNavigate('signup')}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm font-medium px-6 py-2.5 rounded-full shadow-sm h-auto transition-colors"
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
