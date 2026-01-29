import React, { useState, useEffect } from 'react';
import {
    Heart, MapPin, Star, User, ChevronLeft, ChevronRight,
    CheckCircle, Clock, ShieldAlert, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ContactModal from './modals/ContactModal';
import ReportModal from './modals/ReportModal';
import SubmitReviewModal from './modals/SubmitReviewModal';
import { ServiceCard } from './ServiceCard';
import { UserStatus } from '@/components/chat/UserStatus';

const getTimezoneFromLocation = (location) => {
    const loc = location?.toLowerCase() || '';
    if (loc.includes('saudi arabia') || loc.includes('riyadh')) return 'Asia/Riyadh';
    if (loc.includes('dubai') || loc.includes('uae')) return 'Asia/Dubai';
    if (loc.includes('new york') || loc.includes('boston')) return 'America/New_York';
    if (loc.includes('london') || loc.includes('uk')) return 'Europe/London';
    return 'UTC';
};

const ServiceDetails = ({ service, moreServices = [], onNavigateToService, onContact }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState("");
    const [timeZoneDisplay, setTimeZoneDisplay] = useState("");
    const [showContactModal, setShowContactModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    const [reviews, setReviews] = useState(service.reviewsList || []);

    useEffect(() => {
        setCurrentImageIndex(0);
        setReviews(service.reviewsList || []);
        setAvatarError(false);
    }, [service.id, service.reviewsList]);

    useEffect(() => {
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
                providerName={service.provider.name}
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

            <div className="px-4 py-4">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-6">

                    {/* Left Column: Provider Info + Main Content */}
                    <div className="lg:col-span-2 space-y-4">

                        <Card className="overflow-hidden relative shadow-sm border-none">
                            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-10">
                                <div className="flex-shrink-0">
                                    <div className="relative inline-block">
                                        {service.provider.avatarUrl && !avatarError ? (
                                            <img
                                                src={service.provider.avatarUrl}
                                                alt={service.provider.name}
                                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                                                onError={() => setAvatarError(true)}
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <User className="w-16 h-16 text-primary/60" />
                                            </div>
                                        )}
                                        {service.freelancerId && (
                                            <div className="absolute bottom-2 right-2">
                                                <UserStatus userId={service.freelancerId} size="md" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">{service.provider.name}</h1>
                                            <div className="flex flex-wrap items-center gap-6 mt-1 text-lg text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-5 h-5 fill-[#ff9529] text-[#ff9529]" />
                                                    <span className="font-bold">{service.rating}</span>
                                                </div>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-medium text-gray-500">{service.reviewCount} ratings</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-medium text-gray-500">{service.hires} hires</span>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-700 font-bold transition-all flex-shrink-0 text-sm border-gray-100 h-auto">
                                            <Heart className="w-5 h-5" />
                                            <span>Favorite</span>
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-6 text-[17px] text-gray-600 max-w-3xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <span>{service.provider.location}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span>Member since {service.provider.memberSince}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <span>{service.yearsExperience} Years of experience</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-8 mt-8 border-t border-gray-50 pt-8">
                                        <Button onClick={() => setShowContactModal(true)}
                                            variant="default"
                                            size="lg"
                                        >
                                            Contact me
                                        </Button>
                                        <div className="flex items-center gap-2 text-lg text-gray-500 font-medium">
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
                                    <CardContent className="p-6">
                                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black group">
                                            {service.coverType === 'TEXT' && currentImageIndex === 0 ? (
                                                <div className={`w-full h-full ${service.coverColor || 'bg-black'} flex items-center justify-center p-10 text-center`}>
                                                    <span className="text-white font-bold text-4xl md:text-5xl leading-tight line-clamp-4 break-words" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
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
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Description</h3>
                                    <p className="text-lg text-gray-700 leading-relaxed font-normal">
                                        {service.description}
                                    </p>
                                </CardContent>
                            </Card>

                            {service.skills && service.skills.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {service.skills.map((skill, idx) => (
                                                <Badge key={idx} variant="secondary" className="px-6 py-2 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-700 font-bold hover:bg-gray-100 h-auto">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {service.provider.languages && service.provider.languages.length > 0 && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">Languages</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {service.provider.languages.map((lang, idx) => (
                                                <span key={idx} className="px-4 py-2 bg-[#10b981]/5 border border-[#10b981]/10 rounded-xl text-lg text-[#10b981] font-bold">
                                                    {lang}
                                                </span>
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
                                <CardContent className="p-6">
                                    <h3 className="text-lg text-gray-500 mb-2 font-bold uppercase tracking-widest">Starting price</h3>
                                    <div className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                                        {service.priceRange ? service.priceRange.split('-')[0].trim() : `$${service.price}`}
                                    </div>

                                    <ul className="space-y-4 text-lg text-gray-700 leading-relaxed font-medium mb-10 border-t border-gray-50 pt-8">
                                        {service.priceBreakdowns && service.priceBreakdowns.length > 0 ? (
                                            service.priceBreakdowns.map((item, idx) => {
                                                const parseItem = (item) => {
                                                    if (typeof item === 'string') {
                                                        if (item.trim().startsWith('{')) {
                                                            try {
                                                                return JSON.parse(item);
                                                            } catch {
                                                                return { text: item };
                                                            }
                                                        }
                                                        return { text: item };
                                                    }
                                                    return item;
                                                };

                                                const parsed = parseItem(item);
                                                const label = parsed.text || parsed.item || parsed.feature || parsed.description || "Service Detail";
                                                const subDetails = parsed.included || null;

                                                return (
                                                    <li key={idx} className="flex flex-col gap-2">
                                                        <div className="flex items-start gap-3">
                                                            <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                                            <span className="font-bold text-gray-900">{label}</span>
                                                        </div>
                                                        {subDetails && (
                                                            <div className="pl-8 text-base text-gray-600 whitespace-pre-wrap leading-snug">
                                                                <span className="text-xs font-bold uppercase text-gray-400 block mb-1">Included:</span>
                                                                {subDetails}
                                                            </div>
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
                                        onClick={() => setShowContactModal(true)}
                                        className="w-full"
                                        variant="default"
                                       
                                    >
                                        Contact me
                                    </Button>
                                </CardContent>
                            </Card>

                            {service.provider?.availability && (
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-900">Working hours</h3>
                                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-tighter">Live</span>
                                        </div>
                                        <div className="text-lg text-gray-500 font-medium mb-6">
                                            Typical Response Time: <span className="text-gray-900">1 Hour</span>
                                        </div>
                                        <div className="space-y-3 text-[17px] text-gray-700 font-medium">
                                            {service.provider.availability.map((item, idx) => {
                                                const isToday = item.day === new Date().toLocaleDateString('en-US', { weekday: 'short' });
                                                return (
                                                    <div key={idx} className="flex justify-between items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
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

                            <Card className="border-none shadow-sm">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Payment methods</h3>
                                    <p className="text-lg text-gray-600 leading-relaxed font-normal">
                                        {service.paymentMethods?.[0]?.startsWith("I accept payments via")
                                            ? service.paymentMethods.join(', ')
                                            : `This pro accepts payments via ${service.paymentMethods?.join(', ')}.`
                                        }
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardContent className="p-6 flex items-center justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowReportModal(true)}
                                        className="w-full py-6 px-6 border-2 border-dashed border-red-100 rounded-2xl text-red-500 font-bold hover:bg-red-50 hover:text-red-600 transition-all text-base flex items-center justify-center gap-2 h-auto"
                                    >
                                        <ShieldAlert className="w-5 h-5" /> Complaint about service
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <Card className="mt-8 border-none shadow-sm">
                    <CardContent className="p-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Feedback</h3>
                                <p className="text-gray-500 text-lg">Verified reviews from actual clients who hired this pro.</p>
                            </div>
                            <Button onClick={() => setShowReviewModal(true)} className="h-auto">
                                <Plus className="w-5 h-5" /> Write a Review
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-8 items-center">
                            <div className="text-center p-8 bg-[#f8faff] rounded-[2rem] border border-gray-50">
                                <div className="text-5xl font-black text-gray-900 mb-4">{service.rating}</div>
                                <div className="flex justify-center gap-1.5 mb-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className={`w-6 h-6 ${i <= Math.round(service.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                                <div className="text-base text-gray-400 font-bold uppercase tracking-widest">{service.reviewCount} total reviews</div>
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                {[5, 4, 3, 2, 1].map((num) => {
                                    const pct = num === 5 ? 97 : num === 2 ? 1 : num === 1 ? 2 : 0;
                                    return (
                                        <div key={num} className="flex items-center gap-4 text-sm font-bold text-gray-500">
                                            <div className="w-10 flex items-center gap-1">{num} <Star className="w-3.5 h-3.5 text-gray-300" /></div>
                                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                            </div>
                                            <span className="w-10 text-right text-gray-400">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-gray-50/50 rounded-[1.5rem] p-8 border border-gray-100 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            {review.userAvatar ? (
                                                <img src={review.userAvatar} alt={review.userName} className="w-14 h-14 rounded-2xl object-cover border border-white shadow-sm" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-white font-black text-xl border border-white shadow-sm">
                                                    {review.userName.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-lg text-gray-900">{review.userName}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-bold uppercase ml-1">{review.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-lg text-gray-700 leading-relaxed font-normal mb-6 min-h-[80px]">"{review.comment}"</p>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{review.details || "Recent Job"}</span>
                                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#10b981] transition-colors text-xs font-bold">
                                            Helpful
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-6 mt-16 pt-8 border-t border-gray-50">
                            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-900 hover:shadow-sm transition-all disabled:opacity-30">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-4">
                                <button className="w-12 h-12 rounded-2xl bg-gray-900 text-white font-bold shadow-md">1</button>
                                <button className="w-12 h-12 rounded-2xl bg-white text-gray-500 font-bold hover:bg-gray-50 border border-transparent transition-all">2</button>
                                <button className="w-12 h-12 rounded-2xl bg-white text-gray-500 font-bold hover:bg-gray-50 border border-transparent transition-all">3</button>
                            </div>
                            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-sm transition-all">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {moreServices.length > 0 && (
                    <div className="mt-8 pt-8">
                        <div className="flex justify-between items-center mb-8 px-4">
                            <h3 className="text-2xl font-bold text-gray-900">More services from {service.provider.name}</h3>
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
