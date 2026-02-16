'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/utils/api';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Home,
  RefreshCw,
  MapPin,
  Globe,
  Headphones,
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
import { UserIcon, Settings, LogOut, LayoutDashboard, UserCheck, ShoppingBag, MessageSquare, Languages, HelpCircle, Store, AlertCircle } from 'lucide-react';
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { GlobalSearch } from '@/components/search/GlobalSearch';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const { isLoggedIn, role, isSeller, sellerStatus, user, logout, setUser, refreshProfile } = useAuthStore();
  const normalizedRole = role ? role.toUpperCase() : '';
  const isAdmin = normalizedRole === 'ADMIN';

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A');
  const userRoleDisplay = normalizedRole === 'ADMIN' ? 'Super User' : (isSeller && sellerStatus === 'APPROVED' ? 'Client & Seller' : 'Client');
  const displayName = user?.name || 'User';
  const canAccessFreelancerDashboard = isSeller && sellerStatus === 'APPROVED';
  const showRoleToggle = canAccessFreelancerDashboard || normalizedRole === 'FREELANCER';
  const isFreelancerView = pathname.startsWith('/dashboard/freelancer');
  const switchToClient = () => router.push('/');
  const switchToSeller = () => router.push('/dashboard/freelancer');

  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('All location');
  const [manualLocation, setManualLocation] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isResolvingManual, setIsResolvingManual] = useState(false);
  const [isResolvingCountry, setIsResolvingCountry] = useState(false);
  // Header display: when area/city/zip selected show city only (e.g. Lahore); else show full
  const displayLocation = currentLocation.includes(',')
    ? currentLocation.split(',')[0].trim()
    : currentLocation;

  // Load saved location from profile when user is logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    if (user?.location) {
      const loc = user.location.trim();
      setCurrentLocation(loc === 'All World' ? 'All location' : loc);
    } else {
      setCurrentLocation('All location');
    }
  }, [isLoggedIn, user?.location]);

  const saveLocationToProfile = async (locationValue) => {
    if (!isLoggedIn || !locationValue) return;
    try {
      const res = await api.put('/auth/profile', { location: locationValue });
      if (res.data?.user) setUser(res.data.user);
      else await refreshProfile();
    } catch (err) {
      console.error('Failed to save location to profile:', err);
    }
  };
  
  // Check if we can go back (not on home page)
  const canGoBack = pathname !== '/' && pathname !== '/dashboard/freelancer' && !pathname.startsWith('/dashboard/freelancer') && pathname !== '/admin';

  const handleNavigate = (path) => {
    if (path === '' && normalizedRole === 'FREELANCER') {
      router.push('/dashboard/freelancer');
    } else {
      router.push(`/${path}`);
    }
  };

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    setIsLocationPickerOpen(false);
    saveLocationToProfile(location);
  };

  // Returns "City, Country" when available (e.g. Lahore detected → Lahore, Pakistan)
  const reverseGeocode = async (lat, lng) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    const comp = data.results[0].address_components || [];
    const country = comp.find((c) => c.types?.includes('country'))?.long_name;
    const city = comp.find((c) => c.types?.includes('locality'))?.long_name ||
      comp.find((c) => c.types?.includes('administrative_area_level_1'))?.long_name;
    if (country && city) return `${city}, ${country}`;
    if (country) return country;
    return data.results[0].formatted_address || null;
  };

  /** Forward geocode: address text → country (and optionally city, country). Returns { country, display } or null. */
  const forwardGeocode = async (addressText) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressText)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    const comp = data.results[0].address_components || [];
    const country = comp.find((c) => c.types?.includes('country'))?.long_name;
    const city = comp.find((c) => c.types?.includes('locality'))?.long_name;
    if (!country) return data.results[0].formatted_address ? { country: data.results[0].formatted_address, display: data.results[0].formatted_address } : null;
    const display = city ? `${city}, ${country}` : country;
    return { country, display };
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if (!navigator.geolocation) {
      setIsDetectingLocation(false);
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          if (address) {
            setCurrentLocation(address);
            setIsLocationPickerOpen(false);
            await saveLocationToProfile(address);
            toast.success('Location detected and saved to profile');
          } else {
            const fallback = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
            setCurrentLocation(fallback);
            setIsLocationPickerOpen(false);
            await saveLocationToProfile(fallback);
            if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
              toast.info('Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for address names');
            } else {
              toast.success('Location detected and saved to profile');
            }
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          const coords = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
          setCurrentLocation(coords);
          setIsLocationPickerOpen(false);
          await saveLocationToProfile(coords);
          toast.success('Location detected and saved to profile');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsDetectingLocation(false);
        const message = error.code === 1
          ? 'Location permission denied. Allow location access or enter manually.'
          : 'Failed to detect location. Please enter manually.';
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSetCountry = async () => {
    const raw = manualCountry.trim();
    if (!raw) {
      toast.error('Please enter a country');
      return;
    }
    setIsResolvingCountry(true);
    try {
      const resolved = await forwardGeocode(raw);
      const loc = resolved ? (resolved.country || resolved.display) : raw;
      setCurrentLocation(loc);
      setManualCountry('');
      setIsLocationPickerOpen(false);
      await saveLocationToProfile(loc);
      toast.success('Country set. Search limited to ' + loc);
    } catch (err) {
      console.error('Geocode country error:', err);
      setCurrentLocation(raw);
      setManualCountry('');
      setIsLocationPickerOpen(false);
      await saveLocationToProfile(raw);
      toast.success('Country saved');
    } finally {
      setIsResolvingCountry(false);
    }
  };

  const handleSetManualLocation = async () => {
    const raw = manualLocation.trim();
    if (!raw) {
      toast.error('Please enter area, city, or zip');
      return;
    }
    setIsResolvingManual(true);
    try {
      const resolved = await forwardGeocode(raw);
      const loc = resolved ? resolved.display : raw;
      setCurrentLocation(loc);
      setManualLocation('');
      setIsLocationPickerOpen(false);
      await saveLocationToProfile(loc);
      toast.success(resolved ? 'Location resolved and saved' : 'Location saved');
    } catch (err) {
      console.error('Geocode manual error:', err);
      setCurrentLocation(raw);
      setManualLocation('');
      setIsLocationPickerOpen(false);
      await saveLocationToProfile(raw);
      toast.success('Location saved');
    } finally {
      setIsResolvingManual(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Top Bar - mobile: compact, desktop: spacious */}
      <div className="bg-background border-b border-border py-2 sm:py-2.5 md:py-3 px-3 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between sm:justify-between gap-2 sm:gap-3 md:gap-5 lg:gap-8">
          {/* Navigation Icons Group */}
          <div className="flex items-center gap-1 sm:gap-3 md:gap-5 lg:gap-6">
            {/* Back Button - Show when not on home page */}
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => handleNavigate('')}
              aria-label="Go home"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex"
              onClick={() => window.location.reload()}
              aria-label="Refresh page"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
              {/* Location Picker - icon only on xs, text from sm */}
          <DropdownMenu open={isLocationPickerOpen} onOpenChange={setIsLocationPickerOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 sm:gap-2  min-w-0 px-2 sm:px-3 h-8 sm:h-9 md:h-10 "
              >
                <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                <span className="text-xs sm:text-sm font-normal truncate  lg:max-w-none">
                  {displayLocation}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className=" p-0 shadow-lg  mx-4 rounded-xl" align="center" sideOffset={4}>
              <div className="p-4 space-y-3">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Set your location</h3>
                  <p className="text-xs text-muted-foreground">Detect my location or enter manually</p>
                </div>

                {/* All location Option */}
                <Button 
                  variant="outline"
                  onClick={() => handleLocationChange('All location')}
                  className="w-full"
                >
                  <Globe className="w-4 h-4 text-primary" />
                  All location
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

                {/* Country only - search limited to one country (e.g. Pakistan) */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <Input
                    type="text"
                    placeholder="Country"
                    value={manualCountry}
                    onChange={(e) => setManualCountry(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetCountry(); }}
                    size="lg"
                    disabled={isResolvingCountry}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleSetCountry(); }}
                    size="lg"
                    className="rounded-full shrink-0"
                    variant="default"
                    disabled={isResolvingCountry}
                  >
                    {isResolvingCountry ? 'Resolving...' : 'Set'}
                  </Button>
                </div>

                {/* Area, City, Zip - search in specific location (e.g. Lahore only) */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <Input
                    type="text"
                    placeholder="Area, City, Zip"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetManualLocation(); }}
                    size="lg"
                    disabled={isResolvingManual}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleSetManualLocation(); }}
                    size="lg"
                    className="rounded-full shrink-0"
                    variant="default"
                    disabled={isResolvingManual}
                  >
                    {isResolvingManual ? 'Resolving...' : 'Set'}
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

        

          {/* Utility Buttons: Notifications & Support */}
          <div className="flex items-center gap-1 sm:gap-3 md:gap-5 lg:gap-6 shrink-0">
            {isLoggedIn && <NotificationDropdown />}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-2 md:h-10 md:px-4"
              onClick={() => handleNavigate('support')}
              aria-label="Support"
            >
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm font-normal">Support</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header - mobile: logo+auth top, search bottom | desktop: logo | search | auth */}
      <header className="sticky top-0 z-50 bg-background border-b border-border py-3 px-3 sm:py-4 sm:px-6 lg:px-8 xl:py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-3 sm:gap-4 md:flex md:flex-row md:items-center md:justify-between md:gap-6 lg:gap-8">
          {/* Logo - mobile: top-left, desktop: left (order 1) */}
          <div className="col-start-1 row-start-1 flex items-center justify-start md:min-w-[200px] lg:min-w-[220px] min-h-[32px] md:order-1">
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
                className="h-6 w-auto sm:h-8 lg:h-9 object-contain"
                priority
              />
            </Button>
          </div>

          {/* Auth Buttons - mobile: top-right, desktop: right (order 3) */}
          <div className="col-start-2 row-start-1 flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 justify-end md:min-w-[200px] lg:min-w-[240px] shrink-0 self-center md:order-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap justify-end">
                {/* Become seller: show for clients who are not approved sellers */}
                {!isAdmin && normalizedRole === 'CLIENT' && !canAccessFreelancerDashboard && sellerStatus !== 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/become-seller')}
                    className="rounded-full text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 h-auto"
                  >
                    <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" />
                    <span className="hidden sm:inline">Become seller</span>
                    <span className="sm:hidden">Seller</span>
                  </Button>
                )}
                {!isAdmin && normalizedRole === 'CLIENT' && sellerStatus === 'PENDING' && (
                  <span className="text-xs text-muted-foreground px-2.5 sm:px-3 py-1.5 rounded-full bg-muted whitespace-nowrap">Request pending</span>
                )}
                {/* Client | Seller toggle when user has both accesses */}
                {showRoleToggle && (
                  <RoleSwitcher
                    currentRole={isFreelancerView ? 'freelancer' : 'client'}
                    onSwitch={isFreelancerView ? switchToClient : switchToSeller}
                    isOpen={true}
                    className="mb-0 w-auto min-w-0 sm:min-w-[140px] lg:min-w-[160px]"
                  />
                )}
                {/* Profile Section with Dropdown - name/role hidden on mobile */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group outline-none select-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors truncate max-w-[120px] lg:max-w-[160px]">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">{userRoleDisplay}</p>
                      </div>
                      <Avatar className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 border border-border shadow-sm transition-transform group-hover:scale-105 rounded-lg overflow-hidden shrink-0">
                        <AvatarImage src={user?.profileImage} />
                        <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-2 rounded-2xl bg-card border border-border shadow-xl z-[100]" align="end" sideOffset={8}>
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
                         {canAccessFreelancerDashboard && (
                            <DropdownMenuItem onClick={() => router.push('/dashboard/freelancer')} className="cursor-pointer">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                                <LayoutDashboard className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">Seller Dashboard</span>
                            </DropdownMenuItem>
                          )}
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

                          <DropdownMenuItem onClick={() => router.push('/disputes')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Support Tickets</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => router.push('/messages')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Messages</span>
                          </DropdownMenuItem>

                          {/* <DropdownMenuItem onClick={() => { }} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <Languages className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Language</span>
                          </DropdownMenuItem> */}

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

                          {!isAdmin && (
                            <DropdownMenuItem onClick={() => router.push('/dashboard/freelancer/disputes')} className="cursor-pointer">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">Support Tickets</span>
                            </DropdownMenuItem>
                          )}

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
                  size="sm"
                  onClick={() => handleNavigate('login')}
                  className="text-xs sm:text-sm font-medium text-foreground hover:text-muted-foreground hover:bg-muted px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full h-auto"
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/signup')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full shadow-sm h-auto transition-colors"
                >
                  <span className="hidden sm:inline">Join as Client</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              </>
            )}
          </div>

          {/* Search Bar - mobile: row 2 full width, desktop: center (order 2) */}
          <div className="col-span-2 col-start-1 row-start-2 md:col-span-1 md:row-auto md:flex-1 md:order-2 w-full flex justify-center px-0 md:px-4 lg:px-6 min-w-0 max-w-full">
            <Suspense fallback={
              <div className="relative w-full max-w-xl h-10 sm:h-12 rounded-full border border-input bg-muted/30 animate-pulse" />
            }>
              <GlobalSearch className="w-full" />
            </Suspense>
          </div>
        </div>
      </header>
    </div>
  );
}
