'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
import useAuthStore from '@/store/useAuthStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Settings, LogOut, LayoutDashboard, UserCheck } from 'lucide-react';

export function Header({ searchQuery: externalSearchQuery, onSearchChange }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, role, isSeller, sellerStatus, user, logout } = useAuthStore();
  const isAdmin = role === 'admin';
  const isFreelancerView = pathname.startsWith('/dashboard/freelancer');

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A');
  const userRoleDisplay = role === 'admin' ? 'Super User' : (isSeller && sellerStatus === 'approved' ? 'Freelancer' : 'Client');
  const displayName = user?.name || 'User';

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
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button> */}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate('')}
              aria-label="Go home"
            >
              <Home className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              aria-label="Refresh page"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>

          {/* Location Picker */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setIsLocationPickerOpen(!isLocationPickerOpen)}
              className="gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-normal">
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
            {/* <Button
              variant="ghost"
              onClick={() => handleNavigate('admin')}
              className="gap-2"
              aria-label="Admin access"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-normal">Admin</span>
            </Button> */}

            {/* Support Button */}
            <Button
              variant="ghost"
              onClick={() => handleNavigate('support')}
              className="gap-2"
            >
              <Headphones className="w-4 h-4" />
              <span className="text-sm font-normal">Support</span>
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
              className="text-2xl font-bold tracking-tight text-primary hover:text-primary/90 transition-colors h-auto p-0"
            >
              Quicklyway
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 w-full flex justify-center px-0 md:px-4">
            <div className="relative group w-full max-w-xl">
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-6 pr-12 py-3 bg-background border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all shadow-sm text-lg text-foreground placeholder-muted-foreground h-auto"
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
          <div className="flex items-center gap-6 w-full md:w-auto justify-end md:min-w-[200px]">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {isSeller && sellerStatus === 'approved' ? (
                    <Button
                      onClick={() => router.push(isFreelancerView ? '/dashboard/client' : '/dashboard/freelancer')}
                      className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-sm font-medium px-6 py-2.5 rounded-full shadow-sm h-auto transition-colors"
                    >
                      {isFreelancerView ? "Switch to Buying" : "Switch to Selling"}
                    </Button>
                  ) : !isAdmin && (
                    <Button
                      onClick={() => router.push('/become-seller')}
                      className=""
                    >
                      Become a Seller
                    </Button>
                  )}
                </div>

                {/* Profile Section with Dropdown */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer group outline-none select-none">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-gray-900 leading-tight group-hover:text-primary transition-colors">{displayName}</p>
                        <p className="text-[10px] text-gray-400 font-normal uppercase tracking-wider">{userRoleDisplay}</p>
                      </div>
                      <Avatar className="w-9 h-9 border border-gray-100 shadow-sm transition-transform group-hover:scale-105 rounded-lg overflow-hidden">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-[#10b981] text-white rounded-lg text-sm font-medium">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-2 rounded-2xl bg-white border border-gray-100 shadow-xl" align="end">
                    <DropdownMenuLabel className="font-normal p-4">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-gray-900">{displayName}</p>
                        <p className="text-[11px] leading-none text-gray-400 mt-1">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-50 mx-2" />

                    <div className="p-1 space-y-1">
                      <DropdownMenuItem
                        onClick={() => {
                          if (isAdmin) router.push('/admin');
                          else if (isFreelancerView) router.push('/dashboard/freelancer');
                          else router.push('/dashboard/client');
                        }}
                        className=""
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Dashboard</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          if (isAdmin) router.push('/admin/settings');
                          else if (isFreelancerView) router.push('/dashboard/freelancer/settings');
                          else router.push('/dashboard/client/settings');
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">My Profile</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          if (isAdmin) router.push('/admin/settings');
                          else if (isFreelancerView) router.push('/dashboard/freelancer/settings');
                          else router.push('/dashboard/client/settings');
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Settings</span>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="bg-gray-50 mx-2" />

                    <div className="p-1">
                      <DropdownMenuItem
                        onClick={() => {
                          logout();
                          router.push('/login');
                        }}
                        className="  cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/5 focus:bg-destructive/5 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Logout</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigate('login')}
                  className="text-sm font-medium text-foreground hover:text-muted-foreground hover:bg-muted px-4 py-2.5 rounded-full h-auto"
                >
                  Log in
                </Button>
                <Button
                  onClick={() => handleNavigate('signup')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-full shadow-sm h-auto transition-colors"
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
