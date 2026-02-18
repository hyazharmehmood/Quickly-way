"use client";

import React, { useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { Label } from "@/components/ui/label";

const TITLE_MIN = 50;
const TITLE_MAX = 150;
const ABOUT_MIN = 300;
const ABOUT_MAX = 800;

const PostServiceTitle = (props) => {
  const {
    serviceTitle,
    setServiceTitle,
    aboutText,
    setAboutText,
    onBack,
    onNext,
  } = props;

  const [serviceTitleError, setServiceTitleError] = useState("");
  const [aboutError, setAboutError] = useState("");

  const validateServiceTitle = useCallback((title) => {
    if (!title.trim()) return "Service title is required";
    if (title.length < TITLE_MIN) return `Minimum ${TITLE_MIN} characters required`;
    if (title.length > TITLE_MAX) return `Maximum ${TITLE_MAX} characters allowed`;
    return "";
  }, []);

  const validateAbout = useCallback((text) => {
    if (!text.trim()) return "About text is required";
    if (text.length < ABOUT_MIN) return `Minimum ${ABOUT_MIN} characters required`;
    if (text.length > ABOUT_MAX) return `Maximum ${ABOUT_MAX} characters allowed`;
    return "";
  }, []);

  const handleNextClick = () => {
    const titleErr = validateServiceTitle(serviceTitle);
    const aboutErr = validateAbout(aboutText);

    setServiceTitleError(titleErr);
    setAboutError(aboutErr);

    if (!titleErr && !aboutErr) {
      onNext();
    }
  };

  const clearTitleError = () => serviceTitleError && setServiceTitleError("");
  const clearAboutError = () => aboutError && setAboutError("");

  const titleCountClass = cn(
    "text-xs font-medium tabular-nums shrink-0 ml-2",
    serviceTitleError
      ? "text-red-500"
      : serviceTitle.length >= TITLE_MAX
        ? "text-amber-600"
        : serviceTitle.length >= TITLE_MIN
          ? "text-green-600"
          : "text-muted-foreground"
  );

  const aboutCountClass = cn(
    "text-xs tabular-nums shrink-0",
    aboutError
      ? "text-red-500"
      : aboutText.length >= ABOUT_MAX
        ? "text-amber-600"
        : aboutText.length >= ABOUT_MIN
          ? "text-green-600"
          : "text-muted-foreground"
  );

  return (
    <div className="space-y-6">
      {/* Service Title */}
      <div className="space-y-2">
        <Label
          htmlFor="service-title"
          className=""
        >
          Service title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="service-title"
          value={serviceTitle}
          maxLength={TITLE_MAX}
          onChange={(e) => {
            setServiceTitle(e.target.value);
            clearTitleError();
          }}
          onBlur={() => setServiceTitleError(validateServiceTitle(serviceTitle))}
          placeholder="e.g. Logo, Business Card, Flyer, Brochure, Poster, Banner, and Website Design"
          className={cn(
            "transition-colors",
            serviceTitleError && " focus-visible:ring-red-500"
          )}
          aria-invalid={!!serviceTitleError}
          aria-describedby={serviceTitleError ? "title-error" : "title-hint"}
        />
        <div className="flex justify-between items-start gap-3 min-h-5">
          <div className="flex-1 min-w-0">
            {serviceTitleError ? (
              <p
                id="title-error"
                className="flex items-center gap-1.5 text-xs text-red-500"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{serviceTitleError}</span>
              </p>
            ) : (
              <p
                id="title-hint"
                className="text-xs text-muted-foreground leading-relaxed"
              >
                Use keywords that clients search for. Be specific and descriptive.
              </p>
            )}
          </div>
          <span className={titleCountClass}>
            {serviceTitle.length}/{TITLE_MAX}
          </span>
        </div>
      </div>

      {/* About */}
      <div className="space-y-2">
        <Label
          htmlFor="about-text"
          className=""
        >
          About <span className="text-red-500">*</span>
        </Label>  
        <Textarea
          id="about-text"
          rows={6}
          value={aboutText}
          maxLength={ABOUT_MAX}
          onChange={(e) => {
            setAboutText(e.target.value);
            clearAboutError();
          }}
          onBlur={() => setAboutError(validateAbout(aboutText))}
          placeholder="I am a professional designer specializing in logos, brochures, flyers, and complete branding solutions. I deliver high-quality work with quick turnaround..."
          className={cn(
            "resize-none text-base leading-relaxed transition-colors",
            aboutError && " focus-visible:ring-red-500"
          )}
          aria-invalid={!!aboutError}
          aria-describedby={aboutError ? "about-error" : "about-hint"}
        />
        <div className="flex justify-between items-start gap-3 min-h-5">
          <div className="flex-1 min-w-0">
            {aboutError ? (
              <p
                id="about-error"
                className="flex items-center gap-1.5 text-xs text-red-500"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{aboutError}</span>
              </p>
            ) : (
              <p
                id="about-hint"
                className="text-xs text-muted-foreground leading-relaxed"
              >
                Share details about yourself and the services you provide.
              </p>
            )}
          </div>
          <span className={aboutCountClass}>
            {aboutText.length}/{ABOUT_MAX}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          onClick={handleNextClick}
          className={onBack ? "flex-1" : "w-full"}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PostServiceTitle;
