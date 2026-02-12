"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Image as ImageIcon, AlertCircle, Trash2, GripVertical, Type, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils";
import { toast } from "sonner";

const COVER_COLORS = [
  "bg-black",
  "bg-gray-500",
  "bg-red-900",
  "bg-red-600",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-600",
  "bg-purple-600",
];

const COVER_TEXT_MIN = 4;
const COVER_TEXT_MAX = 88;
const GALLERY_MAX = 5;
const MAX_IMAGE_DIMENSION = 1280;
const TARGET_IMAGE_SIZE = 100 * 1024;

const PostServiceInfo = (props) => {
  const {
    coverMode,
    setCoverMode,
    coverText,
    setCoverText,
    coverBgColor,
    setCoverBgColor,
    galleryImages,
    setGalleryImages,
    onNext,
    onBack,
  } = props;

  const coverImage = galleryImages[0];
  const [coverTextError, setCoverTextError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const galleryAddAtRef = useRef(0);
  const coverTextRef = useRef(null);

  const compressImage = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result;
        img.onerror = () => reject(new Error("Failed to load image"));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > height && width > MAX_IMAGE_DIMENSION) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else if (height > MAX_IMAGE_DIMENSION) {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          let quality = 0.9;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length * 0.75 > TARGET_IMAGE_SIZE && quality > 0.2) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          resolve(dataUrl);
        };
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  }, []);

  const processFiles = useCallback(
    async (files) => {
      return Promise.all(
        files.map(async (file) => {
          try {
            return await compressImage(file);
          } catch {
            return URL.createObjectURL(file);
          }
        })
      );
    },
    [compressImage]
  );

  const handleCoverUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const processed = await processFiles(files);
      const currentValid = galleryImages.filter(Boolean);
      const combined = [...currentValid, ...processed];
      const newImages = Array(GALLERY_MAX)
        .fill(null)
        .map((_, i) => combined[i] ?? null);
      setGalleryImages(newImages);
      setCoverMode("image");
      setCoverTextError("");
      e.target.value = "";
    },
    [galleryImages, setGalleryImages, setCoverMode, processFiles]
  );

  const handleGalleryUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const processed = await processFiles(files);
      const newImages = [...galleryImages];
      const insertAt = galleryAddAtRef.current;
      processed.forEach((img, i) => {
        const idx = Math.min(insertAt + i, GALLERY_MAX - 1);
        if (idx < GALLERY_MAX) newImages[idx] = img;
      });
      setGalleryImages(newImages);
      setCoverMode("image");
      e.target.value = "";
    },
    [galleryImages, setGalleryImages, setCoverMode, processFiles]
  );

  const openGalleryPicker = useCallback((atIndex) => {
    galleryAddAtRef.current = atIndex;
    galleryInputRef.current?.click();
  }, []);

  const removeImage = useCallback(
    (idx) => {
      const newImages = [...galleryImages];
      newImages[idx] = null;
      setGalleryImages(newImages);
    },
    [galleryImages, setGalleryImages]
  );

  const handleDragStart = useCallback((e, index) => {
    if (!galleryImages[index]) return;
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.setDragImage(e.currentTarget, 50, 50);
  }, [galleryImages]);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetIndex(null);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e, targetIndex) => {
      e.preventDefault();
      setDropTargetIndex(null);
      setDraggedIndex(null);
      setIsDragging(false);
      const fromIndex = draggedIndex;
      if (fromIndex === null || fromIndex === targetIndex) return;
      const newImages = [...galleryImages];
      const draggedItem = newImages[fromIndex];
      const targetItem = newImages[targetIndex];
      newImages[fromIndex] = targetItem;
      newImages[targetIndex] = draggedItem;
      setGalleryImages(newImages);
    },
    [draggedIndex, galleryImages, setGalleryImages]
  );

  const handleNextClick = useCallback(() => {
    if (!coverMode) {
      toast.error("Please choose a cover type (text or image).");
      return;
    }
    if (coverMode === "text") {
      if (coverText.trim().length < COVER_TEXT_MIN) {
        setCoverTextError(`Minimum ${COVER_TEXT_MIN} characters required`);
        return;
      }
      setCoverTextError("");
    } else {
      if (!galleryImages[0]) {
        toast.error("Please upload at least one cover image.");
        return;
      }
    }
    onNext();
  }, [coverMode, coverText, galleryImages, onNext]);

  const switchToText = useCallback(() => {
    setCoverMode("text");
    setGalleryImages(Array(GALLERY_MAX).fill(null));
    setCoverTextError("");
  }, [setCoverMode, setGalleryImages]);

  useEffect(() => {
    if (coverMode === "text" && coverTextRef.current) {
      coverTextRef.current.style.height = "auto";
      coverTextRef.current.style.height = `${coverTextRef.current.scrollHeight}px`;
    }
  }, [coverText, coverMode]);

  const clearCoverTextError = () => coverTextError && setCoverTextError("");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Post Your Service</h1>

      {/* Cover Section */}
      <div className="flex flex-col md:flex-row items-start gap-6 md:gap-4">
        <input
          ref={coverInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleCoverUpload}
        />
        <input
          ref={galleryInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleGalleryUpload}
        />

        {/* Cover type: one button → menu → Text cover or Image */}
        <div className="flex flex-col gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "rounded-lg gap-2 min-w-[140px] justify-between",
                  (coverMode === "text" || coverMode === "image") &&
                    ""
                )}
                title="Choose cover type"
              >
                <span className="flex items-center gap-2">
                  {coverMode === "text" && <Type className="h-4 w-4 shrink-0" />}
                  {coverMode === "image" && <Camera className="h-4 w-4 shrink-0" />}
                  {!coverMode && <ImageIcon className="h-4 w-4 shrink-0" />}
                  {coverMode === "text" ? "Text cover" : coverMode === "image" ? "Image" : "Cover type"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Choose cover type
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  switchToText();
                }}
                className="gap-2 cursor-pointer"
              >
                <Type className="h-4 w-4" />
                Text cover
                {coverMode === "text" && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCoverMode("image");
                  setCoverTextError("");
                }}
                className="gap-2 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Image
                {coverMode === "image" && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-xs text-muted-foreground">
            {coverMode === "text" ? "Add a text headline with a color" : coverMode === "image" ? "Upload a photo for your cover" : "Text or image"}
          </span>
        </div>

        {/* Cover Preview — only after user chooses Text or Image */}
        {(coverMode === "text" || coverMode === "image") && (
          <div className="flex flex-col items-start gap-2 flex-1 min-w-0">
            <div
              className={cn(
                "w-full max-w-[300px] h-[190px] rounded-xl overflow-hidden relative border-2 border-dashed transition-colors",
                coverMode === "image" && !coverImage
                  ? "border-muted-foreground/30 bg-muted/30 cursor-pointer hover:border-emerald-500/50 hover:bg-muted/50"
                  : "border-muted-foreground/20 bg-muted/20"
              )}
              onClick={() => {
                if (coverMode === "image") coverInputRef.current?.click();
              }}
            >
              {coverMode === "image" ? (
                coverImage ? (
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-sm font-medium">Click to upload cover</span>
                    <span className="text-xs">or drag images below</span>
                  </div>
                )
              ) : (
                <div
                  className={cn(
                    "w-full h-full flex items-center justify-center p-4",
                    coverBgColor
                  )}
                >
                  <textarea
                    ref={coverTextRef}
                    value={coverText}
                    onChange={(e) => {
                      setCoverText(e.target.value);
                      clearCoverTextError();
                    }}
                    onBlur={() =>
                      coverText.length > 0 &&
                      coverText.length < COVER_TEXT_MIN &&
                      setCoverTextError(`Minimum ${COVER_TEXT_MIN} characters`)
                    }
                    maxLength={COVER_TEXT_MAX}
                    placeholder="Type your cover text..."
                    className="w-full h-full bg-transparent text-white text-center text-2xl md:text-3xl font-extrabold resize-none focus:outline-none placeholder-white/70 leading-tight flex items-center justify-center"
                    style={{ padding: "0 12px" }}
                  />
                </div>
              )}
            </div>

            {coverMode === "text" && (
              <div className="flex flex-wrap gap-2 justify-center">
                {COVER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCoverBgColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      c,
                      coverBgColor === c
                        ? "ring-2 ring-offset-2 ring-emerald-500 scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    title={`Background: ${c.replace("bg-", "")}`}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-between items-center w-full max-w-[300px] min-h-5">
              {coverMode === "text" && coverTextError ? (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {coverTextError}
                </p>
              ) : (
                <span />
              )}
              {coverMode === "text" && (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    coverText.length >= COVER_TEXT_MAX ? "text-amber-600" : "text-muted-foreground"
                  )}
                >
                  {coverText.length}/{COVER_TEXT_MAX}
                </span>
              )}
              {coverMode === "image" && (
                <span className="text-xs text-muted-foreground">
                  Recommended: 440×280 px
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gallery Previews - Drag to Reorder (only show when images exist) */}
      {galleryImages.some(Boolean) && (
      <div className="space-y-3">
        <div className="flex items-start flex-col justify-between">
          <label className="text-sm font-medium text-foreground">
            Gallery images
          </label>
          <span className="text-xs text-muted-foreground">
            Drag to reorder • First image is the main cover
          </span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {galleryImages.map((img, idx) => {
            if (!img) return null;
            return (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                "w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-xl border-2 flex items-center justify-center overflow-hidden relative group transition-all duration-150 cursor-grab active:cursor-grabbing",
                idx === 0 ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-border bg-muted/30",
                draggedIndex === idx && "opacity-40 scale-95 cursor-grabbing",
                dropTargetIndex === idx && "ring-2 ring-emerald-500 ring-offset-2 scale-105"
              )}
            >
              {idx === 0 && (
                <div className="absolute top-0 left-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br z-10">
                  MAIN
                </div>
              )}
              <img
                src={img}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />
              {!isDragging && (
                <div className="absolute top-1 left-1 p-1 rounded-md bg-black/40 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
          })}
        </div>
      </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1  "
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          onClick={handleNextClick}
          className="flex-1 "
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PostServiceInfo;
