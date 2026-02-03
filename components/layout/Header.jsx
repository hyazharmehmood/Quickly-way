'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Home,
  RefreshCw,
  MapPin,
  Globe,
  Headphones,
  Search,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import { cn } from '@/utils';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Settings, LogOut, LayoutDashboard, UserCheck, ShoppingBag, MessageSquare, Languages, HelpCircle } from 'lucide-react';

export function Header({ searchQuery: externalSearchQuery, onSearchChange }) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const { isLoggedIn, role, isSeller, sellerStatus, user, logout } = useAuthStore();
  const normalizedRole = role ? role.toUpperCase() : '';
  const isAdmin = normalizedRole === 'ADMIN';
  const isFreelancerView = pathname.startsWith('/dashboard/freelancer');

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A');
  const userRoleDisplay = normalizedRole === 'ADMIN' ? 'Super User' : (isSeller && sellerStatus === 'APPROVED' ? 'Freelancer' : 'Client');
  const displayName = user?.name || 'User';

  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('All Locations');
  const [manualLocation, setManualLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const displayLocation = currentLocation;
  
  // Check if we can go back (not on home page)
  const canGoBack = pathname !== '/' && pathname !== '/dashboard/freelancer' && !pathname.startsWith('/dashboard/freelancer') && pathname !== '/admin';

  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const handleNavigate = (path) => {
    if (path === '' && normalizedRole === 'FREELANCER') {
      router.push('/dashboard/freelancer');
    } else {
      router.push(`/${path}`);
    }
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

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Reverse geocoding would be needed to get location name
          // For now, just set a generic detected location
          setCurrentLocation('Detected Location');
          setIsDetectingLocation(false);
          setIsLocationPickerOpen(false);
          toast.success('Location detected successfully');
        },
        (error) => {
          console.error('Error detecting location:', error);
          setIsDetectingLocation(false);
          toast.error('Failed to detect location. Please enter manually.');
        }
      );
    } else {
      setIsDetectingLocation(false);
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const handleSetManualLocation = () => {
    if (manualLocation.trim()) {
      setCurrentLocation(manualLocation.trim());
      setManualLocation('');
      setIsLocationPickerOpen(false);
      toast.success('Location set successfully');
    } else {
      toast.error('Please enter a location');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Top Bar */}
      <div className="bg-background border-b border-border py-2.5 px-4 sm:px-6 lg:px-8 relative z-[60]">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-8">
          {/* Navigation Icons Group */}
          <div className="flex items-center gap-6">
            {/* Back Button - Show when not on home page */}
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}

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
          <DropdownMenu className="" open={isLocationPickerOpen} onOpenChange={setIsLocationPickerOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 "
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-normal">
                  {displayLocation}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className=" p-0 shadow-none rounded-[1rem] z-80" align="start">
              <div className="p-4 space-y-3">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Set your location</h3>
                  <p className="text-xs text-muted-foreground">Detect my location or enter manually</p>
                </div>

                {/* All World Option */}
                <Button 
                  variant="outline"
                  onClick={() => handleLocationChange('All World')}
                  className="w-full "
                >
     
                    <Globe className="w-4 h-4 text-primary" />
                 
                All World
                </Button>

                {/* Detect Location Option */}
                <Button 
                  variant="outline"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="w-full"
                >
              
                    <Navigation className="w-4 h-4 text-primary" />
               
           
                    {isDetectingLocation ? 'Detecting...' : 'Detect my location'}
                
                </Button>

                {/* Separator */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-popover px-2 text-muted-foreground">OR ENTER MANUALLY</span>
                  </div>
                </div>

                {/* Manual Input */}
                <div className="flex gap-1.5 items-center">
                  <Input
                    type="text"
                    placeholder="Area, City, Country, Zip"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSetManualLocation();
                      }
                    }}
                    size="lg"
             
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetManualLocation();
                    }}
                    size="lg"
                    className="rounded-full"
                    variant="default"
                  >
                    Set
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Utility Buttons: Language & Support */}
          <div className="ml-auto flex items-center gap-6">
            {/* Admin Selector */}


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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start md:min-w-[200px]">
            <Button
              variant="ghost"
              onClick={() => handleNavigate('')}
              className="h-auto p-0 hover:bg-transparent"
            >
              
                <Image
                  src="/images/qw logo tran.png"
                  alt="Quicklyway Logo"
                  width={140}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
              
                />
            
              
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
                {/* Profile Section with Dropdown */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer group outline-none select-none">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">{userRoleDisplay}</p>
                      </div>
                      <Avatar className="w-9 h-9 border border-border shadow-sm transition-transform group-hover:scale-105 rounded-lg overflow-hidden">
                        <AvatarImage src={user?.profileImage} />
                        <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-2 rounded-2xl bg-card border border-border shadow-xl" align="end">
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-foreground">{displayName}</p>
                        <p className="text-[11px] leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border mx-2" />

                    <div className="p-1 space-y-0.5">
                      {/* CLIENT MENU */}
                      {(normalizedRole === 'CLIENT' || normalizedRole === '' || !role) && !isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Profile</span>
                          </DropdownMenuItem>

                          {/* <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground mr-2">
                              <Settings className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Account Settings</span>
                          </DropdownMenuItem> */}

                          <DropdownMenuItem onClick={() => router.push('/orders')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">My Orders</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => router.push('/messages')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Messages</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => { }} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <Languages className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Language</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => router.push('/support')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Help & Support</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      {/* FREELANCER & ADMIN MENU */}
                      {(normalizedRole === 'FREELANCER' || isAdmin) && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              if (isAdmin) router.push('/admin');
                              else router.push('/dashboard/freelancer');
                            }}
                            className="cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <LayoutDashboard className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Dashboard</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              if (isAdmin) router.push('/admin/settings');
                              else router.push('/dashboard/freelancer/settings');
                            }}
                            className="cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Profile</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => router.push('/support')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Help & Support</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>

                    <DropdownMenuSeparator className="bg-border mx-2" />

                    <div className="p-1">
                      <DropdownMenuItem
                        onClick={() => {
                          logout();
                          router.push('/login');
                        }}
                        className="cursor-pointer text-muted-foreground focus:text-foreground hover:bg-secondary focus:bg-secondary transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
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
                  onClick={() => router.push('/signup?role=1')}
                  variant="ghost"
                  className="text-sm font-medium text-foreground hover:text-muted-foreground hover:bg-muted px-4 py-2.5 rounded-full h-auto"
                >
                  Join as Freelancer
                </Button>
                <Button
                  onClick={() => router.push('/signup?role=0')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-full shadow-sm h-auto transition-colors"
                >
                  Join as Client
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
