"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import the entire content component to prevent static generation issues
// This ensures hooks are not called during build-time static generation
const AvailabilityContent = dynamic(
  () => import("./availability-content"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-in fade-in duration-500 space-y-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    ),
  }
);

// Main page component - wrapper that dynamically loads the content
export default function FreelancerAvailabilityPage() {
  return <AvailabilityContent />;
}
