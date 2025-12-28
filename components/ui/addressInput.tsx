"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Loader } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { useTranslations } from "next-intl";

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function AddressInput({
  value,
  onChange,
  onSelect,
  label,
  placeholder,
  disabled = false,
}: AddressInputProps) {
  const t = useTranslations();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    // Close suggestions when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 5) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=nl`,
        {
          headers: {
            "User-Agent": "DeclarationsApp/1.0",
          },
        }
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
    setShowSuggestions(true);
    setLocationError(null);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    onSelect?.(suggestion);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setUsingCurrentLocation(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Reverse geocode the coordinates to get an address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "DeclarationsApp/1.0",
                },
              }
            );

            const data = await response.json();

            if (data && data.display_name) {
              onChange(data.display_name);

              const suggestion: AddressSuggestion = {
                display_name: data.display_name,
                lat: latitude.toString(),
                lon: longitude.toString(),
              };

              onSelect?.(suggestion);
            } else {
              setLocationError(t("error.locationDeterminationFailed"));
            }
          } catch (error) {
            console.error("Error fetching location:", error);
            setLocationError(t("error.locationFetchError"));
          } finally {
            setUsingCurrentLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError(t("locationAccessDenied"));
          setUsingCurrentLocation(false);
        }
      );
    } else {
      setLocationError(t("geolocatioNotSupported"));
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Label htmlFor={label} className="mb-1">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="w-5 h-5 text-muted-foreground" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          className={`pl-10 pr-${isMobile ? "14" : "3"}`}
          placeholder={placeholder || t("addressInput.placeholder")}
          disabled={disabled || usingCurrentLocation}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
        />

        {/* Current location button (mobile only) */}
        {isMobile && !disabled && !usingCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleUseCurrentLocation}
            className="absolute inset-y-0 right-0 pr-3 text-muted-foreground hover:text-primary"
            aria-label={t("addressInput.useCurrentLocation")}
          >
            <Navigation className="w-6 h-6" />
          </Button>
        )}

        {/* Loading indicator */}
        {usingCurrentLocation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Location error message */}
      {locationError && (
        <p className="mt-1 text-sm text-destructive">{locationError}</p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (value.length >= 3 || isLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-popover rounded-md shadow-lg max-h-60 overflow-auto border">
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground flex items-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              <span>{t("addressInput.searching")}</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 text-sm text-foreground hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.display_name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-sm text-muted-foreground">
              {t("addressInput.noAddressesFound")}
            </div>
          )}
        </div>
      )}

      {/* Use current location button (below input for desktop) */}
      {!isMobile && !disabled && (
        <Button
          type="button"
          variant="link"
          onClick={handleUseCurrentLocation}
          className="mt-1 text-sm p-0 h-auto"
          disabled={usingCurrentLocation}
        >
          <Navigation className="w-4 h-4 mr-1" />
          <span>{t("addressInput.useCurrentLocation")}</span>
          {usingCurrentLocation && (
            <Loader className="w-3 h-3 ml-2 animate-spin" />
          )}
        </Button>
      )}
    </div>
  );
}
