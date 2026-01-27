import React, { useState } from 'react';
import { toast } from 'sonner';
import PostServiceInfo from './PostServiceInfo';
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import PostServiceTitle from './PostServiceTitle';
import PostServiceSkills from './PostServiceSkills';
import PostServicePrice from './PostServicePrice';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ALL_WORLD_LANGUAGES } from '@/lib/shared/constants';

const DEFAULT_PRICE_BREAKDOWNS = [
    "Logo design $50 - $500",
    "Business card $50 - $200",
    "Flyer design $50-$300",
    "Brochure design $100 - $800",
    "Poster design $50 - $200",
    "Banner design $50 - $200",
    "Website design $500 - $3000"
];

const ALL_SKILLS = [
    "Graphic Design", "Web Design", "Logo Design", "Branding", "Illustration",
    "UI/UX Design", "3D Animation", "Video Editing", "Copywriting", "SEO",
    "Digital Marketing", "Social Media Management", "Content Writing", "Translation",
    "Web Development", "Mobile App Development", "Software Development", "Data Analysis",
    "Project Management", "Virtual Assistant", "Customer Support", "Voice Over",
    "Photography", "Videography", "Interior Design", "Fashion Design", "Music Production"
];

const DEFAULT_SKILLS = [];

const DEFAULT_LANGUAGES = [
    "English",
    "German Deutsch",
    "Chinese 中文",
    "Hindi हिन्दी",
    "Spanish Español",
    "French Français",
    "Arabic العربية",
    "Bengali বাংলা",
    "Portuguese Português",
    "Russian Русский",
    "Urdu اردو",
];

// ALL_WORLD_LANGUAGES imported from constants

const DEFAULT_PAYMENT_METHODS = "I accept payments via Cash, Check, Credit Card, Google Pay, PayPal, Samsung Pay, Apple Pay, Venmo, and Zelle.";

// Map Tailwind classes to Hex codes for Canvas generation
const BG_COLOR_MAP = {
    "bg-black": "#000000",
    "bg-gray-500": "#6b7280",
    "bg-red-900": "#7f1d1d",
    "bg-red-600": "#dc2626",
    "bg-orange-500": "#f97316",
    "bg-yellow-500": "#eab308",
    "bg-green-500": "#22c55e",
    "bg-blue-500": "#3b82f6",
    "bg-indigo-600": "#4f46e5",
    "bg-purple-600": "#9333ea"
};

// Helper function to generate an image from text - Adjusted to 1100x700 for 11/7 ratio
const generateTextImage = (text, bgClass) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return "";

    // Draw Background
    ctx.fillStyle = BG_COLOR_MAP[bgClass] || "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial Font Setup
    let fontSize = 90; // Starting larger
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = 950;
    const maxHeight = 560; // Padding from edges

    // Smart Wrapping Helper
    const wrapText = (txt, fontSz) => {
        ctx.font = `bold ${fontSz}px Inter, system-ui, sans-serif`;
        const words = txt.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    // Auto-scale font size
    let lines = wrapText(text, fontSize);
    let lineHeight = fontSize * 1.2;
    let totalHeight = lines.length * lineHeight;

    while ((totalHeight > maxHeight || lines.some(l => ctx.measureText(l).width > maxWidth)) && fontSize > 40) {
        fontSize -= 5;
        lines = wrapText(text, fontSize);
        lineHeight = fontSize * 1.2;
        totalHeight = lines.length * lineHeight;
    }

    // Draw Lines Centered
    const startY = (canvas.height - totalHeight) / 2 + (lineHeight / 2);

    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    lines.forEach((l, i) => {
        ctx.fillText(l.trim(), canvas.width / 2, startY + (i * lineHeight) - (lineHeight * 0.1)); // slight adjust
    });

    return canvas.toDataURL("image/png");
};

const PostService = ({ onCancel, onSave, initialData }) => {
    const [step, setStep] = useState(1);

    // --- Step 1 State (Title) ---
    const [serviceTitle, setServiceTitle] = useState("");
    const [aboutText, setAboutText] = useState("");

    // --- Step 2 State (Images) ---
    // Single source of truth: galleryImages. Cover is galleryImages[0] unless text mode.
    const [coverMode, setCoverMode] = useState('image');
    const [coverText, setCoverText] = useState("");
    const [coverBgColor, setCoverBgColor] = useState("bg-black");
    const [galleryImages, setGalleryImages] = useState([null, null, null, null, null]);

    // Derived coverImage for passing to child (read-only mostly, updates go to galleryImages)
    // Actually simplicity: Pass galleryImages to child. Child handles display.

    // --- User State ---
    const [user, setUser] = useState(null);

    // --- Step 3, 4 State (existing) ---
    const [skills, setSkills] = useState([]); // Changed to empty array - will store skill IDs
    const [searchTags, setSearchTags] = useState([]);
    const [priceStr, setPriceStr] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [priceBreakdowns, setPriceBreakdowns] = useState([
        { id: `pb-0`, text: "", price: "", included: "" }
    ]);
    const [paymentMethods, setPaymentMethods] = useState("");
    const [availableForJob, setAvailableForJob] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch User Data on Mount
    React.useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch profile to get availability and user ID
                const response = await api.get('/auth/me');
                const userData = response.data.user;
                setUser(userData);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchUserData();
    }, []);

    // Load Initial Data if Editing
    React.useEffect(() => {
        if (initialData) {
            setServiceTitle(initialData.title || "");
            setAboutText(initialData.description || "");

            setCoverMode(initialData.coverType === 'TEXT' ? 'text' : 'image');
            setCoverText(initialData.coverText || "");
            setCoverBgColor(initialData.coverColor || "bg-black");

            // Reconstruct gallery
            // If coverType is TEXT, coverImage is null usually, images[] has gallery
            // If coverType is IMAGE, coverImage is the main image
            let images = [];
            if (initialData.coverType === 'IMAGE' && initialData.coverImage) {
                // Checking if coverImage is already in images array to avoid dupes would be good but
                // for now let's trust the array structure or just populate from images
                // Actually we defined images[0] as cover.
                if (initialData.images && initialData.images.length > 0) {
                    images = [...initialData.images];
                } else {
                    images = [initialData.coverImage];
                }
            } else {
                images = initialData.images || [];
            }

            // Pad to 5 slots
            while (images.length < 5) images.push(null);
            setGalleryImages(images.slice(0, 5));

            // Extract skill IDs from the service's skills relationship
            const serviceSkillIds = initialData.skills?.map(ss => ss.skill?.id || ss.skillId).filter(Boolean) || [];
            setSkills(serviceSkillIds);
            setSearchTags(initialData.searchTags || []);

            setPriceStr(initialData.price?.toString() || "");
            setSelectedCurrency(initialData.currency || "USD");

            if (initialData.priceBreakdowns && Array.isArray(initialData.priceBreakdowns)) {
                setPriceBreakdowns(initialData.priceBreakdowns);
            }

            setAvailableForJob(initialData.freelancer?.availableForJob || false); // If this exists
        }
    }, [initialData]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();

        if (!priceStr) {
            toast.error("Please fill in price");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Upload Images
            const { uploadToCloudinary } = await import('@/utils/cloudinary');

            // Upload all gallery images first
            const uploadedGallery = await Promise.all(galleryImages.map(async (img) => {
                if (!img) return null;
                if (img.startsWith('data:')) return await uploadToCloudinary(img);
                return img;
            }));

            const validImages = uploadedGallery.filter(Boolean);

            let uploadedCoverImage = null;
            // Generate canvas image if text mode
            if (coverMode === 'text' && coverText) {
                const canvasDataUrl = generateTextImage(coverText, coverBgColor);
                uploadedCoverImage = await uploadToCloudinary(canvasDataUrl);
            } else if (coverMode === 'image') {
                // Use the first image from the uploaded gallery as the cover
                if (validImages.length > 0) {
                    uploadedCoverImage = validImages[0];
                }
            }

            // 2. Prepare Payload
            const payload = {
                // Cover Data
                coverType: coverMode === 'image' ? 'IMAGE' : 'TEXT',
                coverImage: uploadedCoverImage,
                coverText: coverMode === 'text' ? coverText : null,
                coverColor: coverMode === 'text' ? coverBgColor : null,

                title: serviceTitle,
                description: aboutText,
                category: "Logo Design", // TODO: Make dynamic if needed
                subCategory: "", // TODO: Add sub category input

                price: parseFloat(priceStr),
                currency: selectedCurrency,
                priceBreakdowns,
                // Working hours removed - using user profile availability

                images: validImages,
                searchTags, // Add tags to payload
                skillIds: skills, // Add skill IDs to payload for service

                showEmail: user?.showEmail || false,
                showMobile: user?.showMobile || false,
            };
            console.log("payload", payload);
            // 3. Send to API (POST or PUT)
            let response;
            if (initialData) {
                // Update existing service
                response = await api.put(`/services/${initialData.id}`, payload);
            } else {
                // Create new service
                response = await api.post('/services', payload);
            }

            const data = response.data;

            // 4. Cleanup / Redirect
            if (onSave) onSave(data);

        } catch (error) {
            console.error("Error creating service:", error);
            toast.error("Failed to create service. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-none shadow-none">
            <CardContent className="">
                {step === 1 && (
                    <PostServiceTitle
                        serviceTitle={serviceTitle} setServiceTitle={setServiceTitle}
                        aboutText={aboutText} setAboutText={setAboutText}
                        onNext={() => setStep(2)}
                    />
                )}

                {step === 2 && (
                    <PostServiceInfo
                        coverMode={coverMode} setCoverMode={setCoverMode}
                        coverText={coverText} setCoverText={setCoverText}
                        coverBgColor={coverBgColor} setCoverBgColor={setCoverBgColor}
                        galleryImages={galleryImages} setGalleryImages={setGalleryImages}
                        onNext={() => setStep(3)}
                        onBack={() => setStep(1)}
                    />
                )}

                {step === 3 && (
                    <PostServiceSkills
                        skills={skills} setSkills={setSkills}
                        defaultLanguages={DEFAULT_LANGUAGES}
                        allWorldLanguages={ALL_WORLD_LANGUAGES}
                        defaultSkills={DEFAULT_SKILLS}
                        allSkills={ALL_SKILLS}
                        searchTags={searchTags} setSearchTags={setSearchTags}
                        initialSkillIds={initialData?.skills?.map(ss => ss.skill?.id || ss.skillId).filter(Boolean) || []}
                        initialKeywordNames={initialData?.searchTags || []}
                        onBack={() => setStep(2)}
                        onNext={() => setStep(4)}
                    />
                )}

                {step === 4 && (
                    <PostServicePrice
                        priceStr={priceStr} setPriceStr={setPriceStr}
                        selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency}
                        priceBreakdowns={priceBreakdowns} setPriceBreakdowns={setPriceBreakdowns}
                        paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods}
                        availableForJob={availableForJob} setAvailableForJob={setAvailableForJob}
                        defaultPaymentMethods={DEFAULT_PAYMENT_METHODS}
                        defaultPriceBreakdowns={DEFAULT_PRICE_BREAKDOWNS}
                        onBack={() => setStep(3)}
                        onSave={handleSave}
                        onCancel={onCancel}
                        isLoading={isSubmitting}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default PostService;
