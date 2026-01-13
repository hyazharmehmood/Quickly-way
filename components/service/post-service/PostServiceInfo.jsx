import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Trash2, Image as ImageIcon, AlertCircle, Search } from 'lucide-react';
import { COUNTRY_CODES } from '@/utils/constants';

const COVER_COLORS = [
    "bg-black", "bg-gray-500", "bg-red-900", "bg-red-600", "bg-orange-500",
    "bg-yellow-500", "bg-green-500", "bg-blue-500", "bg-indigo-600", "bg-purple-600"
];

const PostServiceInfo = (props) => {
    const {
        displayName, setDisplayName,
        displayEmail, setDisplayEmail,
        mobile, setMobile,
        yearsExperience, setYearsExperience,
        location, setLocation,
        profileImage, setProfileImage,
        coverImage, setCoverImage,
        coverMode, setCoverMode,
        coverText, setCoverText,
        coverBgColor, setCoverBgColor,
        onNext
    } = props;

    // Local state for validation
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [experienceError, setExperienceError] = useState("");
    const [locationError, setLocationError] = useState("");
    const [coverTextError, setCoverTextError] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Country Code State
    const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES.find(c => c.code === "US")?.dial_code || "+1");
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const countryDropdownRef = useRef(null);

    // Cover Image Pan State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const profileInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const coverTextRef = useRef(null);

    // Auto-resize cover text area and keep it centered
    useEffect(() => {
        if (coverMode === 'text' && coverTextRef.current) {
            coverTextRef.current.style.height = 'auto';
            coverTextRef.current.style.height = `${coverTextRef.current.scrollHeight}px`;
        }
    }, [coverText, coverMode]);

    // Image Compression
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_DIMENSION = 1280;

                    if (width > height) {
                        if (width > MAX_DIMENSION) {
                            height = Math.round((height * MAX_DIMENSION) / width);
                            width = MAX_DIMENSION;
                        }
                    } else {
                        if (height > MAX_DIMENSION) {
                            width = Math.round((width * MAX_DIMENSION) / height);
                            height = MAX_DIMENSION;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    let quality = 0.9;
                    let dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const targetSize = 100 * 1024;
                    while (dataUrl.length * 0.75 > targetSize && quality > 0.2) {
                        quality -= 0.1;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleImageUpload = async (e, setFunction) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressedUrl = await compressImage(file);
                setFunction(compressedUrl);
            } catch (error) {
                setFunction(URL.createObjectURL(file));
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setIsCountryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Validation Logic
    const validateName = (name) => {
        if (!name.trim()) return "Name is required";
        if (name.length < 5) return "Minimum 5 characters required";
        if (name.length > 20) return "Maximum 20 character limit";
        return "";
    };

    const validateEmail = (email) => {
        if (!email.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
        return "";
    };

    const validateExperience = (exp) => {
        if (!exp.trim()) return "Experience is required";
        return "";
    };

    const validateLocation = (loc) => {
        if (!loc.trim()) return "Location is required";
        return "";
    };

    const generateCroppedImage = async () => {
        if (!coverImage) return null;
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const displayW = 220;
            const displayH = 140;
            const scale = 2;
            canvas.width = displayW * scale;
            canvas.height = displayH * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(coverImage); return; }
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const img = new Image();
            img.onload = () => {
                const centerX = (displayW / 2) * scale;
                const centerY = (displayH / 2) * scale;
                ctx.translate(centerX, centerY);
                ctx.translate(position.x * scale, position.y * scale);
                const aspectImg = img.width / img.height;
                const aspectDisplay = displayW / displayH;
                let drawW, drawH;
                if (aspectImg > aspectDisplay) {
                    drawW = displayW;
                    drawH = displayW / aspectImg;
                } else {
                    drawH = displayH;
                    drawW = displayH * aspectImg;
                }
                drawW *= scale;
                drawH *= scale;
                ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.src = coverImage;
        });
    };

    const handleNextClick = async () => {
        let valid = true;
        const nErr = validateName(displayName);
        const eErr = validateEmail(displayEmail);
        const expErr = validateExperience(yearsExperience);
        const lErr = validateLocation(location);
        if (nErr) { setNameError(nErr); valid = false; }
        if (eErr) { setEmailError(eErr); valid = false; }
        if (expErr) { setExperienceError(expErr); valid = false; }
        if (lErr) { setLocationError(lErr); valid = false; }
        if (coverMode === 'text' && coverText.length < 4) {
            setCoverTextError("Minimum required 4 character");
            valid = false;
        }
        if (valid) {
            if (coverMode === 'image' && coverImage) {
                setIsGenerating(true);
                const cropped = await generateCroppedImage();
                if (cropped) setCoverImage(cropped);
                setIsGenerating(false);
            }
            onNext();
        }
    };

    const filteredCountries = COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial_code.includes(countrySearch)
    ).sort((a, b) => {
        if (!countrySearch) return 0;
        if (a.name.toLowerCase().startsWith(countrySearch.toLowerCase())) return -1;
        return 1;
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-8 text-left">Post Your Service</h1>

            <div className="flex flex-col md:flex-row items-start gap-20 mb-10">

                {/* PROFILE PICTURE SECTION */}
                <div className="flex flex-col items-center">
                    <input
                        type="file"
                        ref={profileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setProfileImage)}
                    />

                    <div className="flex items-center gap-5">
                        <div
                            onClick={() => profileInputRef.current?.click()}
                            className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border border-gray-100 bg-gray-400"
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white p-4">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full opacity-90">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Profile Action Icons stacked vertically to the right */}
                        <div className="flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={() => profileInputRef.current?.click()}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Upload picture"
                            >
                                <Camera className="w-7 h-7" strokeWidth={1.5} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setProfileImage(null)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove picture"
                            >
                                <Trash2 className="w-7 h-7" strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    <span className="text-sm text-gray-600 font-medium mt-3 relative -left-4">Upload picture</span>
                </div>

                {/* COVER IMAGE SECTION */}
                <div className="flex flex-col items-center md:ml-20">
                    <input
                        type="file"
                        ref={coverInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                            await handleImageUpload(e, setCoverImage);
                            setCoverMode('image');
                            setPosition({ x: 0, y: 0 });
                        }}
                    />

                    <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-3 mt-4">
                            <button type="button" onClick={() => { setCoverMode('image'); coverInputRef.current?.click(); }} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600">
                                <Camera className="w-6 h-6" strokeWidth={2} />
                            </button>
                            <button type="button" onClick={() => setCoverMode('text')} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                                <div className="w-6 h-6 bg-[#10b981] text-white flex items-center justify-center rounded text-[10px] font-bold">ABC</div>
                            </button>
                            <button type="button" onClick={() => { setCoverImage(null); setCoverText(""); setPosition({ x: 0, y: 0 }); }} className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-red-500">
                                <Trash2 className="w-6 h-6" strokeWidth={2} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="w-[220px] max-w-full h-[140px] rounded-xl overflow-hidden relative group shadow-sm border border-dashed border-gray-300">
                                {coverMode === 'image' ? (
                                    <div
                                        onMouseDown={(e) => {
                                            if (!coverImage) return;
                                            setIsDragging(true);
                                            setDragStart({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseMove={(e) => {
                                            if (!isDragging || !coverImage) return;
                                            const deltaX = e.clientX - dragStart.x;
                                            const deltaY = e.clientY - dragStart.y;
                                            setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
                                            setDragStart({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseUp={() => setIsDragging(false)}
                                        onMouseLeave={() => setIsDragging(false)}
                                        onClick={!coverImage ? () => coverInputRef.current?.click() : undefined}
                                        className={`w-full h-full bg-black flex flex-col items-center justify-center transition-colors overflow-hidden ${!coverImage ? 'cursor-pointer hover:bg-gray-900 bg-gray-50' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                    >
                                        {coverImage ? (
                                            <img src={coverImage} alt="Cover" draggable={false} className="w-full h-full object-contain pointer-events-none select-none" style={{ transform: `translate(${position.x}px, ${position.y}px)` }} />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                                                <span className="text-base text-gray-400 text-center px-4 leading-tight">Upload title image</span>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`w-full h-full ${coverBgColor} flex items-center justify-center p-4 overflow-hidden`}>
                                        <textarea
                                            ref={coverTextRef}
                                            value={coverText}
                                            onChange={(e) => setCoverText(e.target.value)}
                                            maxLength={88}
                                            placeholder="Type here"
                                            className="w-full bg-transparent text-white text-center text-xl font-bold resize-none focus:outline-none placeholder-white overflow-hidden no-scrollbar appearance-none"
                                            style={{ padding: 0, border: 'none', boxShadow: 'none', maxHeight: '120px' }}
                                        />
                                    </div>
                                )}
                            </div>
                            {coverMode === 'text' && (
                                <div className="flex gap-1.5 mt-3">
                                    {COVER_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setCoverBgColor(c)} className={`w-5 h-5 rounded-full border border-gray-200 ${c} ${coverBgColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} />
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-between w-full mt-2">
                                {coverMode === 'text' && coverTextError ? (
                                    <div className="flex items-center gap-1 text-red-500 text-xs">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{coverTextError}</span>
                                    </div>
                                ) : <div></div>}
                                {coverMode === 'text' && (
                                    <span className="text-xs text-gray-500">{coverText.length}/88</span>
                                )}
                            </div>
                            {coverMode === 'image' && (
                                <div className="w-[220px] max-w-full mt-3 text-center">
                                    <span className="text-xs text-gray-500">Image size W 440 px H 280 px</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* INPUT FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                    <label className="block text-base font-medium text-gray-900">Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                            setDisplayName(e.target.value);
                            if (nameError) setNameError("");
                        }}
                        onBlur={() => setNameError(validateName(displayName))}
                        maxLength={20}
                        placeholder="Display name"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base text-gray-700 ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'}`}
                    />
                    <div className="flex justify-between items-start mt-1">
                        {nameError ? (
                            <div className="flex items-center gap-1 text-red-500 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                <span>{nameError}</span>
                            </div>
                        ) : <div></div>}
                        <span className="text-sm text-gray-900 font-normal">{displayName.length}/20</span>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-base font-medium text-gray-900">Email <span className="text-red-500">*</span></label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-[#10b981]" />
                            <span className="text-sm text-gray-900">Show my email to client</span>
                        </label>
                    </div>
                    <input
                        type="email"
                        value={displayEmail}
                        onChange={(e) => {
                            setDisplayEmail(e.target.value);
                            if (emailError) setEmailError("");
                        }}
                        onBlur={() => setEmailError(validateEmail(displayEmail))}
                        maxLength={50}
                        placeholder="Display email"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base text-gray-700 ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'}`}
                    />
                    <div className="flex justify-between items-start mt-1">
                        {emailError ? (
                            <div className="flex items-center gap-1 text-red-500 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                <span>{emailError}</span>
                            </div>
                        ) : <div></div>}
                        <span className="text-sm text-gray-900 font-normal">{displayEmail.length}/50</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="block text-base font-medium text-gray-900">Phone</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 accent-[#10b981]" />
                            <span className="text-sm text-gray-900">Show my phone to client</span>
                        </label>
                    </div>
                    <div className="flex">
                        <div className="relative w-[100px]" ref={countryDropdownRef}>
                            <button type="button" onClick={() => setIsCountryOpen(!isCountryOpen)} className="w-full h-full flex items-center justify-between px-3 bg-gray-50 border border-gray-200 border-r-0 rounded-l-lg focus:outline-none">
                                <span className="text-gray-900 text-base font-medium truncate">{selectedCountryCode}</span>
                                <svg className="fill-current h-4 w-4 text-gray-900 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </button>
                            {isCountryOpen && (
                                <div className="absolute top-full left-0 mt-1 w-[300px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[300px] flex flex-col">
                                    <div className="p-2 sticky top-0 bg-white border-b border-gray-100 rounded-t-lg z-10">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" placeholder="Search" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-green-500" autoFocus />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1">
                                        {filteredCountries.map((c) => (
                                            <button key={c.code} type="button" onClick={() => { setSelectedCountryCode(c.dial_code); setIsCountryOpen(false); setCountrySearch(""); }} className={`w-full text-left px-4 py-3 text-base hover:bg-gray-50 flex justify-between items-center ${selectedCountryCode === c.dial_code ? 'bg-gray-100 font-medium' : 'text-gray-700'}`}>
                                                <span>{c.name} {c.dial_code}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter phone number" className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-base text-gray-700" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="block text-base font-medium text-gray-900">Years of experience <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        placeholder="0"
                        value={yearsExperience}
                        maxLength={2}
                        onChange={(e) => {
                            setYearsExperience(e.target.value.replace(/[^0-9]/g, ''));
                            if (experienceError) setExperienceError("");
                        }}
                        onBlur={() => setExperienceError(validateExperience(yearsExperience))}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base text-gray-700 ${experienceError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'}`}
                    />
                    {experienceError && (
                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{experienceError}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                    <label className="block text-base font-medium text-gray-900">Location <span className="text-red-500">*</span></label>
                    <button type="button" className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-green-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors text-base">
                        <MapPin className="w-4 h-4" /> Detect my location
                    </button>
                </div>
                <div className="space-y-1.5">
                    <label className="block text-base font-medium text-gray-900 mb-1">Or enter location manually</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                if (locationError) setLocationError("");
                            }}
                            onBlur={() => setLocationError(validateLocation(location))}
                            placeholder="Al Khobar, Saudi Arabia"
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-base text-gray-700 ${locationError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'}`}
                        />
                        <MapPin className="w-4 h-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    {locationError && (
                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{locationError}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={handleNextClick}
                    disabled={isGenerating}
                    className="bg-[#10b981] hover:bg-green-600 text-white font-bold py-3 px-10 rounded-full transition-colors text-base shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGenerating ? "Processing..." : "Next"}
                </button>
            </div>
        </div>
    );
};

export default PostServiceInfo;
