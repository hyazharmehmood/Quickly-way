import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';

const COVER_COLORS = [
    "bg-black", "bg-gray-500", "bg-red-900", "bg-red-600", "bg-orange-500",
    "bg-yellow-500", "bg-green-500", "bg-blue-500", "bg-indigo-600", "bg-purple-600"
];

const PostServiceInfo = (props) => {
    const {
        coverMode, setCoverMode,
        coverText, setCoverText,
        coverBgColor, setCoverBgColor,
        galleryImages, setGalleryImages,
        onNext, onBack
    } = props;

    // Derived cover image from gallery
    const coverImage = galleryImages[0];

    // Local state for validation
    const [coverTextError, setCoverTextError] = useState("");
    const [draggedIndex, setDraggedIndex] = useState(null);

    const coverInputRef = useRef(null);
    const coverTextRef = useRef(null);

    // Image Compression Helper
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

    // Unified Upload Handler (via Cover Input)
    const handleMainUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Process all files
        const processedImages = await Promise.all(
            files.map(async (file) => {
                try {
                    return await compressImage(file);
                } catch {
                    return URL.createObjectURL(file);
                }
            })
        );

        // Update gallery: Append new images to existing valid images
        const currentValid = galleryImages.filter(Boolean);
        const combined = [...currentValid, ...processedImages];

        // Take first 5, pad with nulls
        const newImages = Array(5).fill(null).map((_, i) => combined[i] || null);

        setGalleryImages(newImages);
        setCoverMode('image');
        e.target.value = ''; // Reset input
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newImages = [...galleryImages];
        const draggedItem = newImages[draggedIndex];
        const targetItem = newImages[targetIndex];

        // Swap
        newImages[draggedIndex] = targetItem;
        newImages[targetIndex] = draggedItem;

        setGalleryImages(newImages);
        setDraggedIndex(null);
    };

    const handleNextClick = async () => {
        let valid = true;

        if (coverMode === 'text' && coverText.length < 4) {
            setCoverTextError("Minimum required 4 character");
            valid = false;
        }
        if (coverMode === 'image' && !galleryImages[0]) {
            alert("Please upload at least one image/thumbnail.");
            valid = false;
        }

        if (valid) {
            onNext();
        }
    };

    // Auto-resize cover text
    useEffect(() => {
        if (coverMode === 'text' && coverTextRef.current) {
            coverTextRef.current.style.height = 'auto';
            coverTextRef.current.style.height = `${coverTextRef.current.scrollHeight}px`;
        }
    }, [coverText, coverMode]);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-8 text-left">Post Your Service</h1>

            <div className="flex flex-col  md:flex-row items-center  gap-20 mb-10">
                {/* COVER IMAGE SECTION */}
                <div className="flex flex-col items-center">
                    <input
                        type="file"
                        ref={coverInputRef}
                        className="hidden"
                        multiple // Enabled multiple selection
                        accept="image/*"
                        onChange={handleMainUpload}
                    />

                    <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                                title="Upload Images"
                            >
                                <Camera className="w-6 h-6" strokeWidth={2} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCoverMode('text');
                                    // Strict Exclusivity: Clear gallery images when switching to text
                                    setGalleryImages([null, null, null, null, null]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                title="Create Text Cover"
                            >
                                <div className="w-6 h-6 bg-[#10b981] text-white flex items-center justify-center rounded text-[10px] font-bold">ABC</div>
                            </button>
                            {/* <button
                                type="button"
                                onClick={() => {
                                    const newImgs = [...galleryImages];
                                    newImgs[0] = null;
                                    setGalleryImages(newImgs);
                                    setCoverText("");
                                }}
                                className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-red-500"
                                title="Remove Main Image"
                            >
                                <Trash2 className="w-6 h-6" strokeWidth={2} />
                            </button> */}
                        </div>

                        <div className="flex flex-col items-center">
                            {/* Main Cover Display */}
                            <div className="w-[300px] h-[190px] rounded-xl overflow-hidden relative group shadow-sm border border-dashed border-gray-300">
                                {coverMode === 'image' ? (
                                    <div
                                        onClick={() => coverInputRef.current?.click()}
                                        className={`w-full h-full bg-black flex flex-col items-center justify-center transition-colors overflow-hidden ${!coverImage ? 'cursor-pointer hover:bg-gray-900 bg-gray-50' : ''}`}
                                    >
                                        {coverImage ? (
                                            <img src={coverImage} alt="Cover" className="w-full h-full object-contain" />
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
                                            className="w-full h-full bg-transparent text-white text-center text-3xl md:text-4xl font-extrabold resize-none focus:outline-none placeholder-white/70 overflow-hidden no-scrollbar appearance-none flex items-center justify-center leading-tight"
                                            style={{ padding: '0 10px', border: 'none', boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Text Color Options */}
                            {coverMode === 'text' && (
                                <div className="flex gap-1.5 mt-3">
                                    {COVER_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setCoverBgColor(c)} className={`w-5 h-5 rounded-full border border-gray-200 ${c} ${coverBgColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} />
                                    ))}
                                </div>
                            )}

                            {/* Validation / Counts */}
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
                                <div className="w-[300px] max-w-full mt-3 text-center">
                                    <span className="text-xs text-gray-500">Image size W 440 px H 280 px</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Previews (Thumbnails) - Draggable */}
            <div className="mb-8 space-y-1.5">
                <label className="block text-base font-medium text-gray-900">Gallery Previews (Drag to Reorder)</label>
                <div className="flex gap-4 overflow-x-auto pb-2 min-h-[100px]">
                    {galleryImages.map((img, idx) => (
                        <div
                            key={idx}
                            draggable={!!img}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                            className={`
                                w-20 h-20 md:w-24 md:h-24 flex-shrink-0 border rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group transition-all
                                ${idx === 0 ? 'border-[#10b981] ring-2 ring-[#10b981]/20' : 'border-gray-200'}
                                ${draggedIndex === idx ? 'opacity-50' : 'opacity-100'}
                                ${img ? 'cursor-grab active:cursor-grabbing' : ''}
                            `}
                        >
                            {/* Primary Badge for Index 0 */}
                            {idx === 0 && img && (
                                <div className="absolute top-0 left-0 bg-[#10b981] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br z-10">
                                    MAIN
                                </div>
                            )}

                            {img ? (
                                <>
                                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover pointer-events-none" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent drag start if clicking remove
                                            const newImgs = [...galleryImages];
                                            newImgs[idx] = null;
                                            setGalleryImages(newImgs);
                                        }}
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-white"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </>
                            ) : (
                                <span className="text-xs text-gray-300 pointer-events-none">Slot {idx + 1}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex-1 py-3.5 border border-gray-300 rounded-full text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                    >
                        Back
                    </button>
                )}
                <button
                    onClick={handleNextClick}
                    className="flex-1 py-3.5 bg-[#10b981] hover:bg-green-600 text-white font-bold rounded-full transition-colors text-base shadow-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default PostServiceInfo;
