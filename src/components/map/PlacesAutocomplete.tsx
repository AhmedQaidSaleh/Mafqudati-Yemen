import { useState, useEffect, useRef, useCallback } from "react";
import { useMapsLibrary, useMap } from "@vis.gl/react-google-maps";
import { Search, MapPin, X, Loader2, Navigation, Compass } from "lucide-react";
import { YEMEN_CENTER } from "@/lib/yemen-geo";

interface PlacesAutocompleteProps {
  onSelectLocation?: (lat: number, lng: number, zoom: number, placeName?: string) => void;
  placeholder?: string;
  className?: string;
}

interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

const POPULAR_YEMEN_CITIES = [
  { name: "صنعاء", desc: "أمانة العاصمة", lat: 15.3694, lng: 44.191, zoom: 13 },
  { name: "عدن", desc: "العاصمة المؤقتة", lat: 12.7855, lng: 45.0187, zoom: 13 },
  { name: "تعز", desc: "محافظة تعز", lat: 13.5795, lng: 44.0209, zoom: 13 },
  { name: "المكلا", desc: "حضرموت الساحل", lat: 14.5425, lng: 49.1242, zoom: 13 },
  { name: "الحديدة", desc: "عروس البحر الأحمر", lat: 14.7978, lng: 42.9545, zoom: 13 },
  { name: "إب", desc: "اللواء الأخضر", lat: 13.9667, lng: 44.1833, zoom: 13 },
];

export function PlacesAutocomplete({
  onSelectLocation,
  placeholder = "ابحث عن مدينة، حي، أو معلم في اليمن...",
  className = "",
}: PlacesAutocompleteProps) {
  const map = useMap();
  const placesLib = useMapsLibrary("places");

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialize Places services when library is ready
  useEffect(() => {
    if (!placesLib) return;

    try {
      if (placesLib.AutocompleteService) {
        autocompleteServiceRef.current = new placesLib.AutocompleteService();
      }
      if (placesLib.AutocompleteSessionToken) {
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      }
      // Create a hidden node for PlacesService if needed
      const dummyDiv = document.createElement("div");
      if (placesLib.PlacesService && map) {
        placesServiceRef.current = new placesLib.PlacesService(dummyDiv);
      }
    } catch (err) {
      console.warn("Error initializing Places services:", err);
    }
  }, [placesLib, map]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions as user types
  const fetchPredictions = useCallback(
    async (inputValue: string) => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      // Try modern Places AutocompleteSuggestion or AutocompleteService
      try {
        if (autocompleteServiceRef.current) {
          const request: google.maps.places.AutocompletionRequest = {
            input: inputValue,
            componentRestrictions: { country: "ye" },
            sessionToken: sessionTokenRef.current || undefined,
          };

          if (map) {
            const center = map.getCenter();
            if (center) {
              request.locationBias = center;
            }
          }

          autocompleteServiceRef.current.getPlacePredictions(
            request,
            (predictions, status) => {
              setLoading(false);
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                predictions &&
                predictions.length > 0
              ) {
                const mapped = predictions.map((p) => ({
                  placeId: p.place_id,
                  mainText: p.structured_formatting?.main_text || p.description,
                  secondaryText: p.structured_formatting?.secondary_text || "",
                  description: p.description,
                }));
                setSuggestions(mapped);
                setIsOpen(true);
              } else {
                setSuggestions([]);
              }
            }
          );
          return;
        }

        // Fallback: search by text if AutocompleteService is not available
        if (placesLib?.Place?.searchByText) {
          const response = await placesLib.Place.searchByText({
            textQuery: `${inputValue}, اليمن`,
            fields: ["id", "displayName", "location", "formattedAddress"],
            locationBias: map?.getCenter() || YEMEN_CENTER,
            maxResultCount: 6,
          });

          setLoading(false);
          if (response.places && response.places.length > 0) {
            const mapped = response.places.map((p) => ({
              placeId: p.id || "",
              mainText: p.displayName || inputValue,
              secondaryText: p.formattedAddress || "اليمن",
              description: p.formattedAddress || p.displayName || inputValue,
            }));
            setSuggestions(mapped);
            setIsOpen(true);
          } else {
            setSuggestions([]);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.warn("Autocomplete fetch error:", err);
        setLoading(false);
        setSuggestions([]);
      }
    },
    [placesLib, map]
  );

  // Debounced input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);

    if (val.trim().length >= 2) {
      fetchPredictions(val);
    } else {
      setSuggestions([]);
      if (val.trim().length === 0) {
        setIsOpen(true); // show popular shortcuts
      }
    }
  };

  // Move camera to location
  const navigateToLocation = useCallback(
    (lat: number, lng: number, zoomLevel = 14, placeName?: string) => {
      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(zoomLevel);
      }
      if (onSelectLocation) {
        onSelectLocation(lat, lng, zoomLevel, placeName);
      }
    },
    [map, onSelectLocation]
  );

  // Handle place selection
  const handleSelectPlace = async (item: PlaceSuggestion) => {
    setQuery(item.mainText);
    setIsOpen(false);
    setSuggestions([]);
    setLoading(true);

    try {
      // If we have PlacesService, fetch precise geometry
      if (placesServiceRef.current && item.placeId) {
        placesServiceRef.current.getDetails(
          {
            placeId: item.placeId,
            fields: ["geometry", "name", "formatted_address"],
            sessionToken: sessionTokenRef.current || undefined,
          },
          (place, status) => {
            setLoading(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const isSpecific = !!place.geometry.viewport;
              navigateToLocation(lat, lng, isSpecific ? 14 : 12, item.mainText);

              // Reset session token after completion
              if (placesLib?.AutocompleteSessionToken) {
                sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
              }
            } else {
              // Fallback text search
              fallbackSearch(item.description || item.mainText);
            }
          }
        );
      } else {
        await fallbackSearch(item.description || item.mainText);
      }
    } catch (err) {
      console.warn("Error fetching place details:", err);
      await fallbackSearch(item.description || item.mainText);
    } finally {
      setLoading(false);
    }
  };

  const fallbackSearch = async (text: string) => {
    if (!placesLib?.Place?.searchByText || !map) return;
    try {
      const response = await placesLib.Place.searchByText({
        textQuery: `${text}, اليمن`,
        fields: ["location", "displayName"],
        locationBias: map.getCenter() || YEMEN_CENTER,
        maxResultCount: 1,
      });
      if (response.places && response.places.length > 0 && response.places[0].location) {
        const loc = response.places[0].location;
        const lat = typeof loc.lat === "function" ? loc.lat() : Number(loc.lat);
        const lng = typeof loc.lng === "function" ? loc.lng() : Number(loc.lng);
        navigateToLocation(lat, lng, 14, text);
      }
    } catch (e) {
      console.warn("Fallback search error:", e);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectPlace(suggestions[selectedIndex]);
      } else if (query.trim()) {
        fallbackSearch(query.trim());
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-20 w-72 sm:w-80 md:w-96 select-none ${className}`}
      dir="rtl"
    >
      {/* Search Input Box */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <span className="text-muted-foreground shrink-0">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <Search className="size-4" />
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          autoComplete="off"
          spellCheck="false"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            title="مسح البحث"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 left-0 bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-1 duration-150 max-h-80 overflow-y-auto">
          {/* Autocomplete Predictions List */}
          {suggestions.length > 0 ? (
            <div className="py-1 divide-y divide-border/40">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground flex items-center justify-between bg-muted/40">
                <span>نتائج البحث الجغرافي المقترحة</span>
                <span className="text-[10px] text-primary">Places Autocomplete</span>
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={item.placeId || idx}
                  type="button"
                  onClick={() => handleSelectPlace(item)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-right transition-colors text-xs ${
                    idx === selectedIndex
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/60 text-foreground"
                  }`}
                >
                  <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{item.mainText}</p>
                    {item.secondaryText && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.secondaryText}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>جاري البحث في مدن وأحياء اليمن...</span>
                </div>
              ) : (
                <div>
                  <p>لم نجد نتائج مطابقة لـ "{query}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      fallbackSearch(query);
                      setIsOpen(false);
                    }}
                    className="mt-2 text-primary hover:underline text-xs font-semibold"
                  >
                    البحث الشامل عبر الخريطة عن "{query}"
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Popular Yemeni Cities Quick Selection */
            <div className="p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mb-2">
                <Compass className="size-3.5 text-primary" />
                <span>المدن والمحافظات الرئيسية:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {POPULAR_YEMEN_CITIES.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      setQuery(city.name);
                      setIsOpen(false);
                      navigateToLocation(city.lat, city.lng, city.zoom, city.name);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-primary/5 text-right transition-all text-xs group"
                  >
                    <Navigation className="size-3 text-primary/70 group-hover:text-primary transition-colors shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{city.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{city.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
