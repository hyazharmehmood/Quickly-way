"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Heart, MapPin, Star, User, ChevronLeft, ChevronRight, ChevronDown,
    CheckCircle, Clock, ShieldAlert, Plus, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ContactModal from './modals/ContactModal';
import ReportModal from './modals/ReportModal';
import SubmitReviewModal from './modals/SubmitReviewModal';
import { ServiceCard } from './ServiceCard';
import { UserStatus } from '@/components/chat/UserStatus';
import useAuthStore from '@/store/useAuthStore';

const getTimezoneFromLocation = (location) => {
    const loc = location?.toLowerCase() || '';
    if (loc.includes('saudi arabia') || loc.includes('riyadh')) return 'Asia/Riyadh';
    if (loc.includes('dubai') || loc.includes('uae')) return 'Asia/Dubai';
    if (loc.includes('new york') || loc.includes('boston')) return 'America/New_York';
    if (loc.includes('london') || loc.includes('uk')) return 'Europe/London';
    return 'UTC';
};

const ServiceDetails = ({ service, reviews: propReviews, moreServices = [], onNavigateToService, onContact }) => {
    console.log('service', service);
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState("");
    const [timeZoneDisplay, setTimeZoneDisplay] = useState("");
    const [showContactModal, setShowContactModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [expandedBreakdownIndex, setExpandedBreakdownIndex] = useState(null);

    // Always prioritize propReviews over service.reviewsList
    const [reviews, setReviews] = useState(propReviews || []);

    useEffect(() => {
        setCurrentImageIndex(0);
        // Always use propReviews if provided, otherwise use service.reviewsList
        if (propReviews && Array.isArray(propReviews)) {
            console.log('ServiceDetails: Using propReviews', propReviews.length);
            setReviews(propReviews);
        } else if (service.reviewsList && Array.isArray(service.reviewsList)) {
            console.log('ServiceDetails: Using service.reviewsList', service.reviewsList.length);
            setReviews(service.reviewsList);
        } else {
            console.log('ServiceDetails: No reviews available');
            setReviews([]);
        }
        setAvatarError(false);
    }, [service.id, service.reviewsList, propReviews]);

    useEffect(() => {
        console.log('ServiceDetails: service.provider.location', service);
        if (!service.provider?.location) return;

        const providerTimezone = getTimezoneFromLocation(service.provider.location);

        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                timeZone: providerTimezone,
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
            setCurrentTime(timeString);

            try {
                const dateInTz = new Date(now.toLocaleString("en-US", { timeZone: providerTimezone }));
                const dateInUtc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
                const offsetHrs = Math.round((dateInTz.getTime() - dateInUtc.getTime()) / 3600000);
                const sign = offsetHrs >= 0 ? '+' : '';
                setTimeZoneDisplay(`(GMT${sign}${offsetHrs})`);
            } catch (e) {
                setTimeZoneDisplay("");
            }
        };

        updateTime();
        const intervalId = setInterval(updateTime, 1000);

        return () => clearInterval(intervalId);
    }, [service.provider?.location]);

    const galleryLength = service.galleryUrls?.length || 0;
    const nextImage = () => {
        if (galleryLength > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % galleryLength);
        }
    };

    const prevImage = () => {
        if (galleryLength > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + galleryLength) % galleryLength);
        }
    };

    const handleContactMeClick = () => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        setShowContactModal(true);
    };

    const handleSubmitReview = (reviewData) => {
        const newReview = {
            id: `r-new-${Date.now()}`,
            userName: "Guest User",
            rating: reviewData.rating || 5,
            comment: reviewData.comment || "",
            date: "Just now",
            details: "Verified Service"
        };
        setReviews([newReview, ...reviews]);
        setShowReviewModal(false);
    };

    return (
        <div>
            <ContactModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                providerName={service.provider?.name}
                providerEmail={service.provider?.email}
                providerPhone={service.provider?.phoneNumber}
                onChatStart={onContact}
            />
            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
            />
            <SubmitReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={handleSubmitReview}
            />

            <div className="px-4 py-4 max-w-7xl mx-auto ">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-6">

                    {/* Left Column: Provider Info + Main Content */}
                    <div className="lg:col-span-2 space-y-4">

                        <Card className="overflow-hidden relative shadow-sm border-none">
                            <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-10">
                                <div className="flex-shrink-0">
                                    <div className="relative inline-block">
                                        {service.provider.avatarUrl && !avatarError ? (
                                            <img
                                                src={service.provider.avatarUrl}
                                                alt={service.provider.name}
                                                className="w-32 h-32 rounded-full object-cover border-2 border-gray-100 shadow-md  "
                                                onError={() => setAvatarError(true)}
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full border-2 border-gray-100 shadow-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <User className="w-16 h-16 text-primary/60" />
                                            </div>
                                        )}
                                        {service.freelancerId && (
                                            <div className="absolute bottom-2.5 right-4">
                                                <UserStatus userId={service.freelancerId} size="md" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-start justify-between gap-2 ">
                                        <div>
                                            <Link 
                                                href={`/freelancer/${service.freelancerId}`}
                                                className="text-xl font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer inline-block"
                                            >
                                                {service.provider.name}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-4 mt-1 text-base text-gray-700">
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-bold">{service.rating?.toFixed(1)}</span>
                                                </div>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-medium text-gray-500">{service.reviewCount?.toFixed(0)} ratings</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-medium text-gray-500">{service.hires?.toFixed(0) } hires</span>
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" className="">
                                            <Heart className="w-4 h-4" />
                                            Favorite
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-4 text-gray-600 max-w-3xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <span>{service.provider.location}</span>
                                        </div>
                                       
                                        {service.provider.languages && service.provider.languages.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                                    <MessageCircle className="w-4 h-4" />
                                                </div>
                                                <span className="line-clamp-1">
                                                    {service.provider.languages.length <= 3
                                                        ? service.provider.languages.join(', ')
                                                        : `${service.provider.languages.slice(0, 2).join(', ')} ...`}
                                                </span>
                                            </div>
                                        )}
                                     
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span>Member since : {service.provider.memberSince}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <span>Years of experience : {service.yearsExperience} </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap flex-row justify-between items-center gap-4 mt-4 border-t border-gray-50 pt-4">
                                        <Button onClick={handleContactMeClick}
                                            variant="default"
                                       
                                            size="lg"
                                        >
                                            Contact me
                                        </Button>
                                          
                                            <div className="text-base  flex-1 justify-center flex items-center gap-2  ">
                                                {service.freelancerId ?<><UserStatus userId={service.freelancerId} size="sm" /> <span className="text-green-600">Online</span></> : <><UserStatus userId={service.freelancerId} size="sm" /> <span className="text-gray-500">Offline</span></>}
                                            </div> 
                                            <div className="flex-1 justify-center flex items-center gap-2 text-base text-gray-500 font-medium">
                                                <Clock className="w-5 h-5 text-gray-400" />
                                                <span>{currentTime}</span>
                                            </div>
                                       
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            {service.galleryUrls && service.galleryUrls.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4 md:p-6 ">
                                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black group">
                                            {service.coverType === 'TEXT' && currentImageIndex === 0 ? (
                                                <div className={`w-full h-full ${service.coverColor || 'bg-black'} flex items-center justify-center px-16 py-18 text-center`}>
                                                    <span className="text-white font-bold text-3xl md:text-4xl leading-tight line-clamp-4 break-words" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                                        {service.coverText}
                                                    </span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={service.galleryUrls[currentImageIndex]}
                                                    alt="Work sample"
                                                    className="w-full h-full object-cover opacity-90 transition-transform duration-700"
                                                />
                                            )}
                                            <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors border border-white/20">
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors border border-white/20">
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-5 gap-4 mt-6 px-2">
                                            {service.galleryUrls.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`relative aspect-video rounded-2xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-[#10b981] scale-105 shadow-md' : 'border-transparent hover:border-gray-200'}`}
                                                >
                                                    {service.coverType === 'TEXT' && idx === 0 ? (
                                                        <div className={`w-full h-full ${service.coverColor || 'bg-black'} flex items-center justify-center p-2 text-center`}>
                                                            <span className="text-white font-bold text-[8px] leading-tight line-clamp-2">
                                                                {service.coverText}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="border-none shadow-sm">
                                <CardContent className="p-4 md:p-6 gap-1  ">
                                    <h3 className="heading-3  ">Description</h3>
                                
                                    <p className="text-base text-gray-700 break-all leading-relaxed font-normal">
                                        {service.description}
                                    </p>
                                </CardContent>
                            </Card>

                            {service.skills && service.skills.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4 md:p-6 flex flex-col gap-1 ">
                                            <h3 className="heading-3  ">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                            {service.skills.map((skill, idx) => (
                                                <Badge key={idx} variant="secondary" size="lg" className="text-base text-gray-600 font-medium   ">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            )}

                            {service.provider.languages && service.provider.languages.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4 md:p-6 flex flex-col gap-1 ">
                                        <h3 className="heading-3  ">Languages</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {service.provider.languages.map((lang, idx) => (
                                                <Badge key={idx} variant="primary" size="lg" className="text-base font-medium   ">
                                                    {lang}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            <Card className="border-none shadow-sm">
                                <CardContent className="p-4 md:p-6 ">
                                  <div className="flex justify-between items-center pb-4">  <h3 className="heading-3  ">Starting price</h3>
                                    <div className="text-xl font-semibold text-gray-900 py-2 tracking-tight">
                                        {service.priceRange ? service.priceRange.split('-')[0].trim() : `$${service.price}`}
                                    </div></div>

                                    <ul className="space-y-2 text-lg text-gray-700 leading-relaxed font-medium mb-10 pt-2 ">
                                        {service.priceBreakdowns && service.priceBreakdowns.length > 0 ? (
                                            service.priceBreakdowns.map((item, idx) => {
                                                const parsed = typeof item === 'object' && item !== null
                                                    ? item
                                                    : (typeof item === 'string' && item.trim().startsWith('{')
                                                        ? (() => { try { return JSON.parse(item); } catch { return { text: item }; }})()
                                                        : { text: item });
                                                const label = parsed.text || parsed.item || parsed.feature || parsed.description || "Service Detail";
                                                const subDetails = parsed.included?.trim() || null;
                                                const isExpanded = expandedBreakdownIndex === idx;
                                                const includedItems = subDetails
                                                    ? subDetails.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
                                                    : [];
                                                const hasIncluded = includedItems.length > 0 || (subDetails && subDetails.length > 0);

                                                return (
                                                    <li key={parsed.id ?? idx} className="border border-gray-100 rounded-lg overflow-hidden">
                                                        <div className="flex items-center justify-start gap-2 p-2">
                                                            <span className="text-base font-medium">{label}</span>
                                                        </div>
                                                        {hasIncluded && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setExpandedBreakdownIndex(isExpanded ? null : idx)}
                                                                    className="flex items-center justify-between w-full gap-2 px-3 pb-3 pt-0 text-left hover:bg-gray-50/50 transition-colors"
                                                                >
                                                                    <span className="text-sm font-medium text-gray-500">Included</span>
                                                                    <ChevronDown
                                                                        className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                    />
                                                                </button>
                                                                {isExpanded && includedItems.length > 0 && (
                                                                    <ul className="px-3 pb-3 pt-0 pl-6 space-y-1">
                                                                        {includedItems.map((line, i) => (
                                                                            <li key={i} className="text-sm text-gray-600">{line}</li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                                {isExpanded && includedItems.length === 0 && subDetails && (
                                                                    <div className="px-3 pb-3 pt-0 pl-6 text-sm text-gray-600 whitespace-pre-wrap">
                                                                        {subDetails}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </li>
                                                );
                                            })
                                        ) : (
                                            <li className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                                <span>Service Details Included</span>
                                            </li>
                                        )}
                                    </ul>

                                    <Button
                                        onClick={handleContactMeClick}
                                        className="w-full"
                                        variant="default"

                                    >
                                        Contact me
                                    </Button>
                                </CardContent>
                            </Card>

                         

                            {service.provider?.availability && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4 md:p-6 ">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="heading-3  ">Working hours</h3>
                                            <span className='flex gap-2'>{service.freelancerId ?<><UserStatus userId={service.freelancerId} size="sm" /> <span className="text-green-600">Online</span></> : <><UserStatus userId={service.freelancerId} size="sm" /> <span className="text-gray-500">Offline</span></>}</span>
                                        </div>
                                        <div className="text-base text-gray-500 font-medium mb-6">
                                            Typical Response Time: <span className="text-gray-900 text-base font-semibold">1 Hour</span>
                                        </div>
                                        <div className="space-y-3 text-[17px] text-gray-700 font-medium">
                                            {service.provider.availability.map((item, idx) => {
                                                const isToday = item.day === new Date().toLocaleDateString('en-US', { weekday: 'short' });
                                                return (
                                                    <div key={idx} className="flex justify-between items-center p-2 rounded-xl hover:bg-gray-50 transition-colors text-base">
                                                        <span className={isToday ? "text-[#10b981] font-bold" : "text-gray-500"}>
                                                            {item.day}
                                                        </span>
                                                    <span className={`text-right ${item.isClosed ? 'text-red-400' : 'font-bold'}`}>
                                                        {item.isClosed ? 'Closed' : `${item.startTime} - ${item.endTime}`}
                                                    </span>
                                                </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-6 text-center font-bold">{currentTime} {timeZoneDisplay}</p>
                                    </CardContent>
                                </Card>
                            )}
                           {service.provider?.employmentStatus && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4 md:p-6">
                                        <h3 className="heading-3 mb-2">Employment Status</h3>
                                        <p className="text-base">{service.provider.employmentStatus}</p>
                                    </CardContent>
                                </Card>
                            )}
                            <Card className="border-none shadow-sm">
                                <CardContent className="p-4 md:p-6">
                                    <h3 className="heading-3 mb-3">Payment methods</h3>
                                    {service.paymentMethods?.length > 0 ? (
                                        <ul className="space-y-2 list-none p-0 m-0 mb-4">
                                            {service.paymentMethods.map((method, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-medium text-gray-800"
                                                >
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                    {method}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                    {service.paymentMethodsText && (
                                        <p className="text-base text-gray-800 font-medium">{service.paymentMethodsText}</p>
                                    )}
                                    {!service.paymentMethods?.length && !service.paymentMethodsText && (
                                        <p className="text-base text-gray-500 leading-relaxed font-normal">
                                            Payment methods not specified.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardContent className="p-4 md:p-6 flex items-center justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowReportModal(true)}
                                        className="w-full  border-2 border-dashed border-red-100 rounded-2xl text-red-500 font-bold hover:bg-red-50 hover:text-red-600 transition-all text-base flex items-center justify-center gap-2 h-auto"
                                    >
                                        <ShieldAlert className="w-5 h-5" /> Complaint about service
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <Card className="mt-8 border-none shadow-sm">
                    <CardContent className="p-4 md:p-6">
                            <div className="mb-8">
                                <h3 className=" heading-3 text-gray-900 mb-2">Reviews</h3>
                                <p className="text-gray-600 text-base">
                                    Customers rated this pro highly for <span className="font-semibold text-gray-900">work quality</span>, <span className="font-semibold text-gray-900">professionalism</span>, and <span className="font-semibold text-gray-900">responsiveness</span>.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-10 mb-10">
                                <div className="flex flex-col">
                                    <div className="text-2xl font-bold text-emerald-600 mb-2">
                                        {Number(service.rating) >= 4.5 ? 'Excellent' : Number(service.rating) >= 4 ? 'Good' : Number(service.rating) >= 3 ? 'Average' : 'Below Average'} {service.rating?.toFixed(1)}
                                    </div>
                                    <div className="flex gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className={`w-6 h-6 ${i <= Math.round(Number(service.rating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-500">{service.reviewCount ?? 0} reviews</span>
                                </div>
                                <div className="flex-1 space-y-3">
                                    {[5, 4, 3, 2, 1].map((num) => {
                                        const reviewsWithRating = reviews.filter((r) => r.rating === num);
                                        const pct = reviews.length > 0
                                            ? Math.round((reviewsWithRating.length / reviews.length) * 100)
                                            : 0;
                                        return (
                                            <div key={num} className="flex items-center gap-3 text-sm">
                                                <span className="w-4 text-gray-600">{num}</span>
                                                <Star className="w-4 h-4 text-gray-300 shrink-0" />
                                                <div className="flex-1 h-2.5 bg-gray-100 rounded overflow-hidden">
                                                    <div
                                                        className={`h-full rounded transition-all duration-500 ${pct > 0 ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="w-10 text-right text-gray-500">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-8">
                            {reviews && Array.isArray(reviews) && reviews.length > 0 ? (
                                reviews.map((review) => {
                                    const initial = (review.userName || 'A').charAt(0).toUpperCase();
                                    return (
                                        <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                                            <div className="flex gap-4">
                                                {review.userAvatar ? (
                                                    <img src={review.userAvatar} alt={review.userName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    
                                                        <div className="w-14 h-14 rounded-full flex items-center justify-center border border-gray-200 bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                  <User className="w-5 h-5 text-primary/60" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <span className="font-bold text-gray-900">{review.userName}</span>
                                                        <span className="text-sm text-gray-400 shrink-0">{review.date}</span>
                                                    </div>
                                                    <div className="flex gap-1 mt-1 mb-2">
                                                        {[1, 2, 3, 4, 5].map((i) => (
                                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed">"{review.comment}"</p>
                                                    {review.details && (
                                                        <p className="text-sm text-gray-400 mt-2">{review.details}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No reviews yet. Be the first to review this service!</p>
                                </div>
                            )}
                            </div>

                          
                    </CardContent>
                </Card>

                {moreServices.length > 0 && (
                    <div className="mt-8 pt-8">
                        <div className="flex justify-between items-center mb-8 px-4">
                                <h2 className="heading-2  ">More services from {service.provider.name}</h2>
                            <button className="text-[#10b981] font-bold hover:underline">See all portfolio</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {moreServices.map(s => (
                                <ServiceCard
                                    key={s.id}
                                    service={s}
                                    onClick={() => onNavigateToService(s)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceDetails;
