import React, { useState, useEffect } from 'react';
import {
    Heart, MapPin, Star, User, ChevronLeft, ChevronRight,
    CheckCircle, Clock, ShieldAlert, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

// Modals
import ContactModal from './modals/ContactModal';
import ReportModal from './modals/ReportModal';
import SubmitReviewModal from './modals/SubmitReviewModal';

// Components
import { ServiceCard } from './ServiceCard'; // For the "More from..." section

// Helper (simple mapping for demo)
const getTimezoneFromLocation = (location) => {
    const loc = location ? location.toLowerCase() : '';

    if (loc.includes('saudi arabia') || loc.includes('riyadh')) return 'Asia/Riyadh';
    if (loc.includes('dubai') || loc.includes('uae')) return 'Asia/Dubai';
    if (loc.includes('new york') || loc.includes('boston')) return 'America/New_York';
    if (loc.includes('london') || loc.includes('uk')) return 'Europe/London';
    // ... add more mappings as needed

    return 'UTC';
};

const ServiceDetails = ({ service, moreServices = [], onNavigateToService, onContact }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState("");
    const [timeZoneDisplay, setTimeZoneDisplay] = useState("");
    const [showContactModal, setShowContactModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const [reviews, setReviews] = useState(service.reviewsList || []);

    useEffect(() => {
        setCurrentImageIndex(0);
        setReviews(service.reviewsList || []);
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

    const nextImage = () => {
        if (service.galleryUrls && service.galleryUrls.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % service.galleryUrls.length);
        }
    };

    const prevImage = () => {
        if (service.galleryUrls && service.galleryUrls.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + service.galleryUrls.length) % service.galleryUrls.length);
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
        <div className="bg-[#f8faff] min-h-screen pb-12">
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

            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-6">

                    {/* Left Column: Provider Info + Main Content */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Header Section - Box Theme */}
                        <Card className=" overflow-hidden relative">
                            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row gap-10">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="relative inline-block">
                                        <img
                                            src={service.provider.avatarUrl}
                                            alt={service.provider.name}
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                                        />
                                        {service.provider.isOnline && (
                                            <span className="absolute bottom-5 right-5 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></span>
                                        )}
                                    </div>
                                </div>

                                {/* Provider Info */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">{service.provider.name}</h1>
                                            {/* Top Stats Line */}
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

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-6 text-[17px] text-gray-600 max-w-3xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600"><MapPin className="w-4 h-4" /></div>
                                            <span>{service.provider.location}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            </div>
                                            <span>{service.provider.languages?.join(', ')}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600"><User className="w-4 h-4" /></div>
                                            <span>Member since {service.provider.memberSince}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600"><CheckCircle className="w-4 h-4" /></div>
                                            <span>{service.yearsExperience} Years of experience</span>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex flex-wrap items-center gap-8 mt-8 border-t border-gray-50 pt-8">
                                        <Button
                                            onClick={() => setShowContactModal(true)}
                                        >
                                            Contact me
                                        </Button>

                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <span className={`w-3 h-3 rounded-full ${service.provider.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            <span className={`${service.provider.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                                                {service.provider.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-lg text-gray-500 font-medium">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <span>{currentTime}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Content Sections - Each in a Box */}
                        <div className="space-y-4">

                            {/* Service Description Box */}
                            <Card className="">
                                <CardContent className="p-10">
                                    <p className="text-xl text-gray-700 leading-relaxed font-normal">
                                        {service.description}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Gallery / Media Box */}
                            {service.galleryUrls && service.galleryUrls.length > 0 && (
                                <Card className="">
                                    <CardContent className="p-8">
                                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black group">
                                            <img
                                                src={service.galleryUrls[currentImageIndex]}
                                                alt="Work sample"
                                                className="w-full h-full object-cover opacity-90 transition-transform duration-700"
                                            />

                                            {/* Arrows */}
                                            <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors border border-white/20">
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors border border-white/20">
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {/* Thumbnails */}
                                        <div className="grid grid-cols-5 gap-4 mt-6 px-2">
                                            {service.galleryUrls.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`relative aspect-video rounded-2xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-[#10b981] scale-105 shadow-md' : 'border-transparent hover:border-gray-200'}`}
                                                >
                                                    <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* About Box */}
                            <Card className="">
                                <CardContent className="p-10">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">About</h3>
                                    <p className="text-lg text-gray-700 leading-relaxed font-normal">
                                        {service.bio}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Skills Box */}
                            <Card className="">
                                <CardContent className="p-10">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Skills</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {service.skills?.map((skill, idx) => (
                                            <Badge key={idx} variant="secondary" className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-lg text-gray-700 font-bold hover:bg-gray-100 h-auto">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Expertise Box */}
                            <Card className="">
                                <CardContent className="p-10">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Expertise</h3>
                                    <p className="text-lg text-gray-700 leading-relaxed font-normal italic">
                                        {service.expertise}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Languages Box */}
                            {service.provider.languages && service.provider.languages.length > 0 && (
                                <Card className="">
                                    <CardContent className="p-10">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Languages</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {service.provider.languages.map((lang, idx) => (
                                                <span key={idx} className="px-6 py-3 bg-[#10b981]/5 border border-[#10b981]/10 rounded-2xl text-lg text-[#10b981] font-bold">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">

                            {/* Price Card Box */}
                            <Card className="">
                                <CardContent className="p-8">
                                    <h3 className="text-lg text-gray-500 mb-2 font-bold uppercase tracking-widest">Starting price</h3>
                                    <div className="text-4xl font-black text-gray-900 mb-8 tracking-tight">
                                        {service.priceRange ? service.priceRange.split('-')[0].trim() : `$${service.price}`}
                                    </div>

                                    <ul className="space-y-4 text-lg text-gray-700 leading-relaxed font-medium mb-10 border-t border-gray-50 pt-8">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                            <span>4 SEO-optimized blog posts</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                            <span>Keyword research included</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                            <span>Meta descriptions & tags</span>
                                        </li>
                                    </ul>

                                    <div className="text-lg text-gray-700 font-black mb-8 flex items-center gap-2">
                                        <Clock className="w-5 h-5" /> Completion: 20 Days
                                    </div>

                                    <Button
                                        onClick={() => setShowContactModal(true)}
                                        className="w-full"
                                    >
                                        Contact me
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Working Hours Box */}
                            {service.workingHours && (
                                <Card className="">
                                    <CardContent className="p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-900">Working hours</h3>
                                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-tighter">Live</span>
                                        </div>

                                        <div className="text-lg text-gray-500 font-medium mb-6">
                                            Responds in {service.workingHours.responseTime}
                                        </div>

                                        <div className="space-y-3 text-[17px] text-gray-700 font-medium">
                                            {service.workingHours.schedule.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <span className="text-gray-500">{item.day}</span>
                                                    <span className="text-right font-bold">{item.hours}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-6 text-center font-bold">{currentTime} {timeZoneDisplay}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment Methods Box */}
                            <Card className="">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Payment methods</h3>
                                    <p className="text-lg text-gray-600 leading-relaxed font-normal">
                                        {service.paymentMethods && service.paymentMethods[0]?.startsWith("I accept payments via")
                                            ? service.paymentMethods.join(', ')
                                            : `This pro accepts payments via ${service.paymentMethods?.join(', ')}.`
                                        }
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Complaint Box */}
                            <Card className="">
                                <CardContent className="p-8 flex items-center justify-center">
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

                {/* Reviews Section - Box Theme Overall */}
                <Card className="mt-8 ">
                    <CardContent className="p-10">
                        <section>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Customer Feedback</h3>
                                    <p className="text-gray-500 text-lg">Verified reviews from actual clients who hired this pro.</p>
                                </div>
                                <Button
                                    onClick={() => setShowReviewModal(true)}
                                    className=" h-auto "
                                >
                                    <Plus className="w-5 h-5" /> Write a Review
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-8 items-center">
                                {/* Score */}
                                <div className="text-center p-8 bg-[#f8faff] rounded-[2rem] border border-gray-50">
                                    <div className="text-5xl font-black text-gray-900 mb-4">{service.rating}</div>
                                    <div className="flex justify-center gap-1.5 mb-3">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-6 h-6 ${i <= Math.round(service.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
                                    </div>
                                    <div className="text-base text-gray-400 font-bold uppercase tracking-widest">{service.reviewCount} total reviews</div>
                                </div>

                                {/* Bars */}
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
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Review List - Each review is a Box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-gray-50/50 rounded-[1.5rem] p-8 border border-gray-100 hover:shadow-md transition-all group">
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
                                            {/* Replaced 'Helpful' button with Shadcn style or keep as simple button since it's an icon interaction */}
                                            <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#10b981] transition-colors text-xs font-bold">
                                                {/* <ThumbsUp className="w-3.5 h-3.5" /> Helpful - Icon not imported, skipping or re-importing */}
                                                Helpful
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Box */}
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
                        </section>
                    </CardContent>
                </Card>

                {/* More Services Section */}
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
