import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

const PostServiceTitle = (props) => {
    const {
        serviceTitle, setServiceTitle,
        galleryImages, setGalleryImages,
        aboutText, setAboutText,
        onBack, onNext
    } = props;

    const [serviceTitleError, setServiceTitleError] = useState("");
    const [aboutError, setAboutError] = useState("");
    const galleryInputRef = useRef(null);
    const titleTextareaRef = useRef(null);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

    // Auto-resize service title textarea to accommodate wrapping text
    useEffect(() => {
        if (titleTextareaRef.current) {
            titleTextareaRef.current.style.height = 'auto';
            titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
        }
    }, [serviceTitle]);

    const validateServiceTitle = (title) => {
        if (!title.trim()) return "Service title is required";
        if (title.length < 50) return "Minimum 50 characters required";
        if (title.length > 150) return "Maximum 150 characters allowed";
        return "";
    };

    const validateAbout = (text) => {
        if (!text.trim()) return "About text is required";
        if (text.length < 50) return "Minimum 50 characters required";
        if (text.length > 800) return "Maximum 800 characters allowed";
        return "";
    };

    const handleGalleryImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            const newImages = [...galleryImages];
            newImages[activeGalleryIndex] = imageUrl;
            setGalleryImages(newImages);
            e.target.value = '';
        }
    };

    const triggerGalleryUpload = (index) => {
        setActiveGalleryIndex(index);
        galleryInputRef.current?.click();
    };

    const handleNextClick = () => {
        const titleErr = validateServiceTitle(serviceTitle);
        const aboutErr = validateAbout(aboutText);

        setServiceTitleError(titleErr);
        setAboutError(aboutErr);

        if (!titleErr && !aboutErr) {
            onNext();
        }
    };

    return (
        <div>
            {/* Service Title */}
            <div className="mb-6 space-y-1.5">
                <label className="block text-base font-medium text-gray-900">Service title <span className="text-red-500">*</span></label>
                <textarea
                    ref={titleTextareaRef}
                    rows={1}
                    value={serviceTitle}
                    maxLength={150}
                    onPaste={(e) => {
                        // Pre-emptively handle paste to ensure limit is never breached visually or in state
                        const pasteData = e.clipboardData.getData('text');
                        // If combined length exceeds 150, slice immediately
                        if (serviceTitle.length + pasteData.length > 150) {
                            e.preventDefault();
                            const truncated = (serviceTitle + pasteData).slice(0, 150);
                            setServiceTitle(truncated);
                        }
                    }}
                    onChange={(e) => {
                        // Double reinforcement: truncate any input to 150 characters
                        const val = e.target.value.slice(0, 150);
                        setServiceTitle(val);
                        if (serviceTitleError) setServiceTitleError("");
                    }}
                    onBlur={() => setServiceTitleError(validateServiceTitle(serviceTitle))}
                    placeholder="Logo, Business Card, Flyer, Brochure, Poster, Banner, and Website Design Services"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base text-gray-700 resize-none overflow-hidden ${serviceTitleError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'}`}
                />
                <div className="flex justify-between text-xs mt-1">
                    <div className="flex-1">
                        {serviceTitleError ? (
                            <div className="flex items-center gap-1 text-red-500">
                                <AlertCircle className="w-3 h-3" />
                                <span>{serviceTitleError}</span>
                            </div>
                        ) : (
                            <span className="text-gray-500">Your service title is very important, so include proper keywords that clients can use to search for your service.</span>
                        )}
                    </div>
                    <span className={`${serviceTitleError ? 'text-red-500' : 'text-gray-500'} ml-2 font-medium`}>{serviceTitle.length}/150</span>
                </div>
            </div>

            {/* Upload Images Row */}
            <div className="mb-8 space-y-1.5">
                <label className="block text-base font-medium text-gray-900">Upload Images</label>
                <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleGalleryImageUpload}
                />
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {galleryImages.map((img, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => triggerGalleryUpload(idx)}
                            className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 text-gray-400 overflow-hidden relative cursor-pointer"
                        >
                            {img ? (
                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-6 h-6" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* About */}
            <div className="mb-6 space-y-1.5">
                <label className="block text-base font-medium text-gray-900">About <span className="text-red-500">*</span></label>
                <textarea
                    rows={6}
                    value={aboutText}
                    maxLength={800}
                    onChange={(e) => {
                        setAboutText(e.target.value);
                        if (aboutError) setAboutError("");
                    }}
                    onBlur={() => setAboutError(validateAbout(aboutText))}
                    placeholder="I am a professional designer specializing in logos, brochures, flyers, and complete branding solutions..."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base text-gray-700 leading-relaxed resize-none ${aboutError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'}`}
                />
                <div className="flex justify-between items-start mt-1">
                    <div className="flex-1">
                        {aboutError && (
                            <div className="flex items-center gap-1 text-red-500 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                <span>{aboutError}</span>
                            </div>
                        )}
                        {!aboutError && (
                            <span className="text-xs text-gray-500">Share some details about yourself, and the services you provide.</span>
                        )}
                    </div>
                    <span className={`text-xs ${aboutError ? 'text-red-500' : 'text-gray-500'}`}>
                        {aboutText.length}/800 characters
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
                <button
                    onClick={onBack}
                    className="flex-1 py-3.5 border border-gray-300 rounded-full text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={handleNextClick}
                    className="flex-1 py-3.5 bg-[#10b981] text-white rounded-full font-bold hover:bg-green-600 transition-colors shadow-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default PostServiceTitle;
