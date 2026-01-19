"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ImageGallery({ images = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!images?.length) return null;

  const openModal = (index) => setSelectedIndex(index);
  const closeModal = () => setSelectedIndex(null);

  // Single image case
  if (images.length === 1) {
    const img = images[0];
    return (
      <>
        <div 
          className="relative group max-w-[280px] sm:max-w-[320px] cursor-pointer overflow-hidden rounded-2xl border border-border/50 shadow-sm" 
          onClick={() => openModal(0)}
        >
          <img
            src={img.attachmentUrl}
            alt={img.content || ""}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {img.content?.trim() && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3">
              <p className="text-white text-xs sm:text-sm leading-snug line-clamp-2">{img.content}</p>
            </div>
          )}
        </div>
        <ImageModal images={images} initialIndex={selectedIndex} isOpen={selectedIndex !== null} onClose={closeModal} />
      </>
    );
  }

  return (
    <>
      <div className={cn(
        "grid gap-0.5 rounded-2xl overflow-hidden w-full max-w-[280px] sm:max-w-[400px] border border-border/50 shadow-sm",
        getGridClass(images.length)
      )}>
        {images.slice(0, 4).map((img, idx) => (
          <GridImage 
            key={img.id || idx} 
            image={img} 
            index={idx} 
            total={images.length} 
            onClick={() => openModal(idx)} 
          />
        ))}
      </div>
      <ImageModal images={images} initialIndex={selectedIndex} isOpen={selectedIndex !== null} onClose={closeModal} />
    </>
  );
}

function getGridClass(count) {
  if (count === 2) return "grid-cols-2 aspect-[4/3]";
  if (count === 3) return "grid-cols-2 aspect-[4/3]"; 
  return "grid-cols-2 aspect-square"; 
}

function GridImage({ image, index, total, onClick }) {
  const isLastVisible = index === 3 && total > 4;

  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden bg-muted group",
        total === 3 && index === 0 ? "row-span-2" : ""
      )}
      onClick={onClick}
    >
      <img
        src={image.attachmentUrl}
        alt=""
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      {isLastVisible && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-[2px]">
          <span className="text-white text-xl sm:text-2xl font-bold">+{total - 3}</span>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
//                Fullscreen Modal
// ──────────────────────────────────────────────

function ImageModal({ images, initialIndex, isOpen, onClose }) {
  const [index, setIndex] = useState(initialIndex ?? 0);

  useEffect(() => {
    if (isOpen && initialIndex !== null) setIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const prev = useCallback((e) => {
    e?.stopPropagation();
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const next = useCallback((e) => {
    e?.stopPropagation();
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, prev, next]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-[100dvh] p-0 border-none bg-black/95 gap-0 overflow-hidden sm:rounded-none">
        
        {/* Mobile Header */}
        <div className="absolute top-0 inset-x-0 h-14 sm:h-16 flex items-center justify-between px-4 z-50 bg-black/20 backdrop-blur-md border-b border-white/5">
          <div className="flex flex-col">
            <span className="text-white text-sm font-semibold">
              {index + 1} / {images.length}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-white hover:bg-white/10 rounded-full h-10 w-10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white transition-colors hidden md:block bg-black/20 hover:bg-black/40 p-4 rounded-full border border-white/10"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={next}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white transition-colors hidden md:block bg-black/20 hover:bg-black/40 p-4 rounded-full border border-white/10"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Fullscreen Viewport */}
        <div 
          className="relative w-full h-full flex flex-col items-center justify-center pt-14 pb-14"
          onClick={next}
        >
          <img
            src={images[index].attachmentUrl}
            alt="View"
            className="max-w-[95%] max-h-[85vh] object-contain select-none transition-all duration-300 animate-in fade-in zoom-in-95"
            draggable={false}
          />

          {/* Caption */}
          {images[index].content && (
            <div 
              className="absolute bottom-0 inset-x-0 p-6 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white text-sm sm:text-base leading-relaxed max-w-2xl mx-auto text-center font-light">
                {images[index].content}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Pagination Dots (Mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-50">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-white" : "w-1 bg-white/30"
                )} 
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
