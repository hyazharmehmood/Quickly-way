import React, { useState } from 'react';
import PostServiceInfo from './PostServiceInfo';
import PostServiceTitle from './PostServiceTitle';
import PostServiceSkills from './PostServiceSkills';
import PostServicePrice from './PostServicePrice';

const DEFAULT_PRICE_BREAKDOWNS = [
    "Logo design $50 - $500",
    "Business card $50 - $200",
    "Flyer design $50-$300",
    "Brochure design $100 - $800",
    "Poster design $50 - $200",
    "Banner design $50 - $200",
    "Website design $500 - $3000"
];

const DEFAULT_SKILLS = ["Adobe Illustrator", "Graphic Design", "3D Animation"];
const DEFAULT_EXPERTISE = ["AI Graphic Design", "2d Animation", "Digital Storyboards"];
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

const ALL_WORLD_LANGUAGES = [
    "Afrikaans", "Albanian Shqip", "Amharic አማርኛ", "Arabic العربية", "Armenian Հայերեն", "Assamese অসমীয়া", "Aymara Aymar aru", "Azerbaijani Azərbaycan dili",
    "Bambara Bamanankan", "Basque Euskara", "Belarusian Беларуская", "Bengali বাংলা", "Bhojpuri भोजपुरी", "Bosnian Bosanski", "Bulgarian Български", "Burmese မြန်မာစာ",
    "Catalan Català", "Cebuano Bisaya", "Chichewa Nyanja", "Chinese 中文", "Corsican Corsu", "Croatian Hrvatski", "Czech Čeština", "Danish Dansk", "Dhivehi ދِوهِ", "Dogri डोगरी", "Dutch Nederlands",
    "English", "Esperanto Esperanto", "Estonian Eesti", "Ewe Eʋegbe", "Filipino Tagalog", "Finnish Suomi", "French Français", "Frisian Frysk", "Fulani Fulfulde",
    "Galician Galego", "Georgian ქართული", "German Deutsch", "Greek Ελληνικά", "Guarani Avañe'ẽ", "Gujarati ગુજરાતી", "Haitian Creole Kreyòl Ayisyen", "Hausa Harshen Hausa", "Hawaiian ʻŌlelo Hawaiʻi", "Hebrew עברית", "Hindi हिन्दी",
    "Hmong Hmoob", "Hungarian Magyar", "Icelandic Íslenska", "Igbo Asụsụ Igbo", "Ilocano Iloko", "Irish Gaeilge", "Italian Italiano", "Japanese 日本語", "Javanese Basa Jawa",
    "Kannada ಕನ್ನಡ", "Kazakh Қазақ тілі", "Khmer ខ្មែរ", "Kinyarwanda Ikinyarwanda", "Konkani कोंकणी", "Korean 한국어", "Krio Krio", "Kurdish (Kurmanji) Kurmancî", "Kurdish (Sorani) سۆرانی",
    "Kyrgyz Кыргызча", "Lao ລາວ", "Latin Latina", "Latvian Latviešu", "Lingala Lingála", "Lithuanian Lietuvių", "Luganda Luganda", "Luxembourgish Lëtzebuergesch", "Macedonian Македонски", "Maithili मैथिली",
    "Malagasy Malagasy", "Malayalam മലയാളം", "Maltese Malti", "Maori Te Reo Māori", "Marathi मराठी", "Meiteilon (Manipuri) ꯃꯤꯇꯩꯂꯣꯟ", "Mizo Mizo ṭawng", "Mongolian Монгол",
    "Myanmar (Burmese) မြันမာစာ", "Nepali नेपाली", "Norwegian Norsk", "Odia (Oriya) ଓଡ଼ିଆ", "Oromo Afaan Oromoo", "Pashto پښتو", "Persian فارسی", "Polish Polski", "Portuguese Português",
    "Punjabi ਪੰਜਾਬੀ", "Quechua Runa Simi", "Romanian Română", "Russian Русский", "Samoan Gagana faʻa Sāmoa", "Sanskrit संस्कृतम्", "Scots Gaelic Gàidhlig", "Sepedi Sesotho sa Leboa", "Serbian Српски", "Sesotho Sesotho",
    "Shona ChiShona", "Sindhi سنڌي", "Sinhala සිංහල", "Slovak Slovenčina", "Slovenian Slovenščina", "Somali Soomaaliga", "Spanish Español", "Sundanese Basa Sunda", "Swahili Kiswahili", "Swedish Svenska", "Tajik Тоҷикӣ",
    "Tamil தமிழ்", "Tatar Татарча", "Telugu తెలుగు", "Thai ไทย", "Tigrinya ትግርኛ", "Tsonga Xitsonga", "Turkmen Türkmençe", "Twi Twi", "Ukrainian Українська", "Urdu اردو", "Uyghur ئۇيغۇرچە",
    "Uzbek Oʻzbekcha", "Vietnamese Tiếng Việt", "Welsh Cymraeg", "Xhosa isiXhosa", "Yiddish ייִדיש", "Yoruba Yorùbá", "Zulu isiZulu"
];

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

// Initial start times only.
const INITIAL_SCHEDULE_DATA = [
    { day: "Mon", startTime: "08:00 AM", isClosed: false },
    { day: "Tue", startTime: "08:00 AM", isClosed: false },
    { day: "Wed", startTime: "08:00 AM", isClosed: false },
    { day: "Thu", startTime: "08:00 AM", isClosed: false },
    { day: "Fri", startTime: "08:00 AM", isClosed: false },
    { day: "Sat", startTime: "08:00 AM", isClosed: false },
    { day: "Sun", startTime: "08:00 AM", isClosed: true }
];

const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (modifier === 'PM' && hours !== 12) hours += 12;
    return hours * 60 + (minutes || 0);
};

const calculateEndTime = (startTime, durationHours) => {
    if (!startTime) return "";
    const startM = getMinutes(startTime);
    const endM = (startM + durationHours * 60) % 1440;
    const h = Math.floor(endM / 60);
    const m = endM % 60;
    const modifier = h >= 12 ? 'PM' : 'AM';
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${modifier}`;
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

    // Configure Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Text Wrapping Logic
    const words = text.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = 900;
    const lineHeight = 90;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Draw Lines Centered
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalHeight) / 2 + (lineHeight / 2);

    lines.forEach((l, i) => {
        ctx.fillText(l.trim(), canvas.width / 2, startY + (i * lineHeight));
    });

    return canvas.toDataURL("image/png");
};

const PostService = ({ onCancel, onSave }) => {
    const [step, setStep] = useState(1);

    // --- Step 1 State ---
    const [displayName, setDisplayName] = useState("");
    const [displayEmail, setDisplayEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [yearsExperience, setYearsExperience] = useState("");
    const [location, setLocation] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [coverMode, setCoverMode] = useState('image');
    const [coverText, setCoverText] = useState("");
    const [coverBgColor, setCoverBgColor] = useState("bg-black");

    // --- Step 2 State ---
    const [serviceTitle, setServiceTitle] = useState("");
    const [galleryImages, setGalleryImages] = useState([null, null, null, null, null]);
    const [aboutText, setAboutText] = useState("");

    // --- Step 3 State ---
    const [skills, setSkills] = useState(DEFAULT_SKILLS);
    const [expertise, setExpertise] = useState(DEFAULT_EXPERTISE);
    const [languages, setLanguages] = useState([]);

    // --- Step 4 State ---
    const [priceStr, setPriceStr] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [priceBreakdowns, setPriceBreakdowns] = useState(
        DEFAULT_PRICE_BREAKDOWNS.map((text, index) => ({ id: `pb-${index}`, text: "" }))
    );
    const [scheduleData, setScheduleData] = useState(() => {
        return INITIAL_SCHEDULE_DATA.map(d => ({
            ...d,
            endTime: calculateEndTime(d.startTime, 10),
            error: ""
        }));
    });
    const [paymentMethods, setPaymentMethods] = useState("");
    const [availableForJob, setAvailableForJob] = useState(false);

    const handleSave = () => {
        if (!priceStr) {
            alert("Please fill in price");
            return;
        }

        const providerId = `p-${Date.now()}`;
        const newProvider = {
            id: providerId,
            name: displayName,
            avatarUrl: profileImage || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&h=300&fit=crop",
            location: location || "Unknown Location",
            isOnline: true,
            languages: languages,
            memberSince: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        const formattedSchedule = scheduleData.map(item => ({
            day: item.day,
            hours: item.isClosed ? "Unavailable" : `${item.startTime}–${item.endTime}`
        }));

        // Determine the final thumbnail URL
        let finalThumbnail = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1100&h=700&fit=crop";

        if (coverMode === 'image' && coverImage) {
            finalThumbnail = coverImage;
        } else if (coverMode === 'text' && coverText) {
            // Generate image from text
            finalThumbnail = generateTextImage(coverText, coverBgColor);
        }

        const newService = {
            id: `s-${Date.now()}`,
            provider: newProvider,
            title: serviceTitle,
            description: aboutText,
            thumbnailUrl: finalThumbnail,
            rating: 5.0,
            reviewCount: 0,
            price: parseInt(priceStr) || 0,
            category: "Logo Design",
            priceRange: `${selectedCurrency} ${priceStr}`,
            hires: 0,
            yearsExperience: parseInt(yearsExperience) || 1,
            bio: aboutText,
            skills: skills,
            expertise: expertise.join(', '),
            galleryUrls: galleryImages.filter(img => img !== null),
            reviewsList: [],
            workingHours: {
                timezone: "UTC",
                responseTime: "1 Hour",
                schedule: formattedSchedule
            },
            paymentMethods: [paymentMethods],
            isAvailableForEmployment: availableForJob
        };

        onSave(newService);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10">

                {step === 1 && (
                    <PostServiceInfo
                        displayName={displayName} setDisplayName={setDisplayName}
                        displayEmail={displayEmail} setDisplayEmail={setDisplayEmail}
                        mobile={mobile} setMobile={setMobile}
                        yearsExperience={yearsExperience} setYearsExperience={setYearsExperience}
                        location={location} setLocation={setLocation}
                        profileImage={profileImage} setProfileImage={setProfileImage}
                        coverImage={coverImage} setCoverImage={setCoverImage}
                        coverMode={coverMode} setCoverMode={setCoverMode}
                        coverText={coverText} setCoverText={setCoverText}
                        coverBgColor={coverBgColor} setCoverBgColor={setCoverBgColor}
                        onNext={() => setStep(2)}
                    />
                )}

                {step === 2 && (
                    <PostServiceTitle
                        serviceTitle={serviceTitle} setServiceTitle={setServiceTitle}
                        galleryImages={galleryImages} setGalleryImages={setGalleryImages}
                        aboutText={aboutText} setAboutText={setAboutText}
                        onBack={() => setStep(1)}
                        onNext={() => setStep(3)}
                    />
                )}

                {step === 3 && (
                    <PostServiceSkills
                        skills={skills} setSkills={setSkills}
                        expertise={expertise} setExpertise={setExpertise}
                        languages={languages} setLanguages={setLanguages}
                        defaultLanguages={DEFAULT_LANGUAGES}
                        allWorldLanguages={ALL_WORLD_LANGUAGES}
                        defaultSkills={DEFAULT_SKILLS}
                        defaultExpertise={DEFAULT_EXPERTISE}
                        onBack={() => setStep(2)}
                        onNext={() => setStep(4)}
                    />
                )}

                {step === 4 && (
                    <PostServicePrice
                        priceStr={priceStr} setPriceStr={setPriceStr}
                        selectedCurrency={selectedCurrency} setSelectedCurrency={setSelectedCurrency}
                        priceBreakdowns={priceBreakdowns} setPriceBreakdowns={setPriceBreakdowns}
                        scheduleData={scheduleData} setScheduleData={setScheduleData}
                        paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods}
                        availableForJob={availableForJob} setAvailableForJob={setAvailableForJob}
                        defaultPaymentMethods={DEFAULT_PAYMENT_METHODS}
                        defaultPriceBreakdowns={DEFAULT_PRICE_BREAKDOWNS}
                        onBack={() => setStep(3)}
                        onSave={handleSave}
                        onCancel={onCancel}
                    />
                )}
            </div>
        </div>
    );
};

export default PostService;
