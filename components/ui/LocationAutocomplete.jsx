"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { MapPin, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils";

const GOOGLE_SCRIPT_URL = "https://maps.googleapis.com/maps/api/js";

function formatPlaceToLocation(place) {
  if (!place) return "";
  const comp = place.address_components || [];
  const country = comp.find((c) => c.types?.includes("country"))?.long_name;
  const locality =
    comp.find((c) => c.types?.includes("locality"))?.long_name ||
    comp.find((c) => c.types?.includes("administrative_area_level_1"))?.long_name;
  if (country && locality) return `${locality}, ${country}`;
  if (country) return country;
  return place.formatted_address || "";
}

function loadGooglePlacesScript(apiKey) {
  if (typeof window === "undefined") return Promise.reject(new Error("window undefined"));
  if (window.google?.maps?.places) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src^="${GOOGLE_SCRIPT_URL}"]`);
    if (existing) {
      if (window.google?.maps?.places) return resolve();
      existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = `${GOOGLE_SCRIPT_URL}?key=${apiKey}&libraries=places&callback=__locationAutocompleteLoaded`;
    script.async = true;
    script.defer = true;

    window.__locationAutocompleteLoaded = () => {
      delete window.__locationAutocompleteLoaded;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function LocationAutocomplete({
  value = "",
  onChange,
  placeholder = "Search city or country...",
  disabled,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const placesServiceRef = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGooglePlacesScript(apiKey)
      .then(() => {
        if (cancelled) return;
        setScriptReady(true);
        if (window.google?.maps?.places) {
          placesServiceRef.current = new window.google.maps.places.PlacesService(
            document.createElement("div")
          );
        }
      })
      .catch(() => setScriptReady(false));
    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => {
    if (!scriptReady || !apiKey || !debouncedQuery.trim()) {
      setPredictions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input: debouncedQuery, types: ["geocode"] },
      (results) => {
        if (cancelled) return;
        setPredictions(results || []);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      setLoading(false);
    };
  }, [scriptReady, apiKey, debouncedQuery]);

  const handleSelectPrediction = useCallback(
    (prediction) => {
      if (!prediction?.place_id || !onChange || !placesServiceRef.current) return;

      const service = placesServiceRef.current;
      service.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["address_components", "formatted_address"],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const locationStr = formatPlaceToLocation(place);
            if (locationStr) {
              onChange(locationStr);
              setOpen(false);
              setSearchQuery("");
            }
          } else {
            onChange(prediction.description || "");
            setOpen(false);
            setSearchQuery("");
          }
        }
      );
    },
    [onChange]
  );

  const showFallback = !apiKey;

  return (
    <div className={cn("space-y-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-start h-11 min-h-[42px] py-2 px-3 rounded-lg font-normal",
              "flex items-center gap-2 border-input"
            )}
          >
            <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className={cn(!value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl overflow-hidden" align="start">
          <Command className="rounded-xl" shouldFilter={false}>
            <CommandInput
              placeholder="Search city or country..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : predictions.length === 0 ? (
                <CommandEmpty>
                  {debouncedQuery.trim()
                    ? "No locations found. Type to search."
                    : "Type to search for a location."}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {predictions.map((pred) => (
                    <CommandItem
                      key={pred.place_id}
                      value={pred.place_id}
                      onSelect={() => handleSelectPrediction(pred)}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{pred.description}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showFallback && (
        <p className="text-xs text-muted-foreground">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for location suggestions.
        </p>
      )}
    </div>
  );
}

export default LocationAutocomplete;
