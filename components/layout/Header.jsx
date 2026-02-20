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
  ChevronDown,
  Check,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { COUNTRIES_FOR_LOCATION } from '@/utils/constants';
import LocationAutocomplete from '@/components/ui/LocationAutocomplete';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Settings, LogOut, LayoutDashboard, UserCheck, ShoppingBag, MessageSquare, Languages, HelpCircle, Store, AlertCircle, Heart, X, Trash2 } from 'lucide-react';
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ChatNotificationDropdown } from '@/components/notifications/ChatNotificationDropdown';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useContactSupport } from '@/context/ContactSupportContext';
import useChatUnreadStore from '@/store/useChatUnreadStore';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import useLocationFilterStore from '@/store/useLocationFilterStore';
import useFavoritesStore from '@/store/useFavoritesStore';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const { isLoggedIn, role, isSeller, sellerStatus, user, logout, setUser } = useAuthStore();
  const { locationFilter, setLocationFilter } = useLocationFilterStore();
  const { favorites, removeFavorite, clearAllFavorites } = useFavoritesStore();
  const normalizedRole = role ? role.toUpperCase() : '';
  const isAdmin = normalizedRole === 'ADMIN';

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A');
  const userRoleDisplay = normalizedRole === 'ADMIN' ? 'Super User' : (normalizedRole === 'FREELANCER' ? 'Seller' : (isSeller && sellerStatus === 'APPROVED' ? 'Client & Seller' : 'Client'));
  const displayName = user?.name || 'User';
  const canAccessFreelancerDashboard = isSeller && sellerStatus === 'APPROVED';
  // Only show role switcher when user has BOTH client and seller (e.g. CLIENT with approved seller)
  const showRoleToggle = normalizedRole === 'CLIENT' && canAccessFreelancerDashboard;
  const isFreelancerView = pathname.startsWith('/dashboard/seller');
  const switchToClient = () => router.push('/');
  const switchToSeller = () => router.push('/dashboard/seller');
  const { openContactSupport } = useContactSupport();
  const { setConversationsUnread, applyConversationUpdated } = useChatUnreadStore();
  const messagesPath = pathname?.startsWith('/dashboard/seller') ? '/dashboard/seller/messages' : '/messages';
  const { socket, isConnected } = useGlobalSocket();

  // Keep chat unread badge updated: fetch when not on messages page, and listen for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !isLoggedIn) return;
    const onConversationUpdated = (data) => data?.conversation && applyConversationUpdated(data.conversation);
    socket.on('conversation:updated', onConversationUpdated);
    if (!pathname?.includes('/messages')) {
      socket.emit('get_conversations');
      const onFetched = (data) => setConversationsUnread(data.conversations || []);
      socket.once('conversations:fetched', onFetched);
    }
    return () => {
      socket.off('conversation:updated', onConversationUpdated);
    };
  }, [socket, isConnected, isLoggedIn, pathname, setConversationsUnread, applyConversationUpdated]);

  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  // Header display: when area/city/zip selected show city only (e.g. Lahore); else show full. Filter-only, not saved to profile.
  const displayLocation = locationFilter.includes(',')
    ? locationFilter.split(',')[0].trim()
    : locationFilter;

  // Check if we can go back (not on home page)
  const canGoBack = pathname !== '/' && pathname !== '/dashboard/seller' && !pathname.startsWith('/dashboard/seller') && pathname !== '/admin';

  const handleNavigate = (path) => {
    if (path === '' && normalizedRole === 'FREELANCER') {
      router.push('/dashboard/seller');
    } else {
      router.push(`/${path}`);
    }
  };

  const handleLocationChange = (location) => {
    setLocationFilter(location);
    setIsLocationPickerOpen(false);
    // toast.success('Services filtered by location');
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
          const res = await fetch(
            `/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`
          );
          const data = await res.json();
          if (data.success && data.location) {
            setLocationFilter(data.location);
            if (data.country) setManualCountry(data.country);
            if (data.city) setManualLocation(data.city);
            else if (data.location) setManualLocation(data.location);
            setIsLocationPickerOpen(false);
          } else {
            const fallback = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
            setLocationFilter(fallback);
            setIsLocationPickerOpen(false);
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          const coords = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
          setLocationFilter(coords);
          setIsLocationPickerOpen(false);
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

  const handleCountrySelect = (countryName) => {
    if (!countryName) return;
    setLocationFilter(countryName);
    setManualCountry('');
    setCountryPopoverOpen(false);
    setIsLocationPickerOpen(false);
    // toast.success('Services filtered by ' + countryName);
  };

  const handleSetManualLocation = () => {
    const loc = manualLocation.trim();
    if (!loc) {
      toast.error('Search and select a location, then click Set');
      return;
    }
    setLocationFilter(loc);
    setManualLocation('');
    setIsLocationPickerOpen(false);
    // toast.success('Services filtered by ' + (loc.includes(',') ? loc.split(',')[0].trim() : loc));
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
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer"
              onClick={() => handleNavigate('')}
              aria-label="Go home"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex cursor-pointer"
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
                className="gap-1.5 sm:gap-2  min-w-0 px-2 sm:px-3 h-8 sm:h-9 md:h-10 cursor-pointer"
              >
                <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                <span className="text-xs sm:text-sm font-normal truncate  lg:max-w-none">
                  {displayLocation}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className=" p-0 shadow-lg  min-w-[400px] max-w-[450px] mx-4 rounded-xl" align="center" sideOffset={4}>
              <div className="p-4 space-y-3">
                {/* Header */}
                <div>
                  <h3 className="heading-3">Set your location</h3>
                  <p className="text-sm text-muted-foreground">Detect my location or enter manually</p>
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

                {/* Country – searchable combobox (shadcn Popover + Command) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Country</label>
                  <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={countryPopoverOpen}
                        className="w-full h-11 justify-between font-normal"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className={cn(!manualCountry && 'text-muted-foreground')}>
                          {manualCountry || 'Select country'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Command shouldFilter={true}>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {COUNTRIES_FOR_LOCATION.map((country) => (
                              <CommandItem
                                key={country}
                                value={country}
                                onSelect={() => handleCountrySelect(country)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    manualCountry === country ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Area, City, Zip – same as PostServiceProfile: search, select from dropdown, then Set */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <LocationAutocomplete
                      value={manualLocation}
                      onChange={setManualLocation}
                      placeholder="Area, City, Zip"
                      className="[&_button]:rounded-lg"
                    />
                  </div>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleSetManualLocation(); }}
                    size="lg"
                    className="rounded-full shrink-0 h-11"
                    variant="default"
                  >
                    Set
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

        

          {/* Utility Buttons: Favorites, Notifications & Support */}
          <div className="flex items-center gap-1 sm:gap-3 md:gap-5 lg:gap-6 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 relative"
                  aria-label="Favorites"
                >
                  <Heart className="h-4 w-4 sm:w-5 sm:h-5" />
                  {favorites?.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center px-1">
                      {favorites.length > 9 ? '9+' : favorites.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 max-h-[380px] overflow-y-auto p-0 rounded-xl border border-border shadow-xl" align="end" sideOffset={8}>
                <div className="px-4 py-3 border-b border-border">
                  <DropdownMenuLabel className="font-semibold text-foreground p-0">Favorites</DropdownMenuLabel>
                  <p className="text-xs text-muted-foreground mt-0.5">Your saved services</p>
                </div>
                {!favorites?.length ? (
                  <div className="py-8 text-center text-sm text-muted-foreground px-4">
                    No favorites yet. Save services from their detail page.
                  </div>
                ) : (
                  <>
                    <div className="py-1">
                      {favorites.map((fav) => (
                        <DropdownMenuItem
                          key={fav.id}
                          className="cursor-pointer p-0 focus:bg-muted/50 rounded-none"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center gap-3 px-4 py-3 w-full">
                            <Link href={`/services/${fav.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                                {fav.image ? (
                                  <img
                                    src={fav.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                                    <Heart className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                                  {fav.title || 'Service'}
                                </p>
                                {fav.price != null && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {fav.currency} {typeof fav.price === 'number' ? fav.price.toLocaleString() : fav.price}
                                  </p>
                                )}
                              </div>
                            </Link>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              aria-label="Remove from favorites"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFavorite(fav.id);
                                toast.success('Removed from favorites');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <div className="border-t border-border px-4 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                        onClick={() => {
                          clearAllFavorites();
                          toast.success('Favorites cleared');
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Clear all
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {isLoggedIn && (
              <>
                <ChatNotificationDropdown />
                <NotificationDropdown />
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-2 md:h-10 md:px-4 cursor-pointer"
              onClick={openContactSupport}
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
                {/* Join as Seller: show for clients who are not approved sellers */}
                {!isAdmin && normalizedRole === 'CLIENT' && !canAccessFreelancerDashboard && sellerStatus !== 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/join-as-freelancer')}
                    className="rounded-full text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 h-auto"
                  >
                    <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4  shrink-0" />
                    <span className="hidden sm:inline">Become a Seller</span>
                    <span className="sm:hidden">Become a Seller</span>
                  </Button>
                )}
                {/* Join as Client: show for seller-only users (role FREELANCER) */}
                {!isAdmin && normalizedRole === 'FREELANCER' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/join-as-client')}
                    className="rounded-full text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 h-auto"
                  >
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4  shrink-0" />
                    <span className="hidden sm:inline">Become a Client</span>
                    <span className="sm:hidden">Become a Client</span>
                  </Button>
                )}
                {!isAdmin && normalizedRole === 'CLIENT' && (sellerStatus === 'PENDING' || sellerStatus === 'pending') && (
                  <span className="text-xs text-muted-foreground px-2.5 sm:px-3 py-1.5 rounded-full bg-muted whitespace-nowrap">Request pending</span>
                )}
                {/* Client | Seller toggle when user has both accesses */}
                {showRoleToggle && (
                  <RoleSwitcher
                    currentRole={isFreelancerView ? 'seller' : 'client'}
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
                            <DropdownMenuItem onClick={() => router.push('/dashboard/seller')} className="cursor-pointer">
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
                            <span className="text-sm font-medium">Orders</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => router.push('/disputes')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Disputes</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => router.push('/support')} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <Headphones className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Support tickets</span>
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

                          <DropdownMenuItem onClick={openContactSupport} className="cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Help & Support</span>
                          </DropdownMenuItem>
                         
                        </>
                      )}

                      {/* SELLER-ONLY (FREELANCER) & ADMIN MENU */}
                      {(normalizedRole === 'FREELANCER' || isAdmin) && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              if (isAdmin) router.push('/admin');
                              else router.push('/dashboard/seller');
                            }}
                            className="cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <LayoutDashboard className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{isAdmin ? 'Dashboard' : 'Seller Dashboard'}</span>
                          </DropdownMenuItem>

                          {!isAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => router.push('/dashboard/seller/messages')} className="cursor-pointer">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Messages</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push('/dashboard/seller/disputes')} className="cursor-pointer">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Disputes</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push('/support')} className="cursor-pointer">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                                  <Headphones className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">My support tickets</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push('/join-as-client')} className="cursor-pointer">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                                  <UserCheck className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Join as Client</span>
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuItem
                            onClick={() => {
                              if (isAdmin) router.push('/admin/settings');
                              else router.push('/dashboard/seller/settings');
                            }}
                            className="cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-2">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">Profile</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={openContactSupport} className="cursor-pointer">
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
                  className="  bg-muted "
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => router.push('/signup')}
                  className=""
                >
                  <span className="hidden sm:inline">Sign up</span>
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
