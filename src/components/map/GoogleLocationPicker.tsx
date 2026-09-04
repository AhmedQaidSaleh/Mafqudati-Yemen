import { useState, useCallback, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, MapMouseEvent } from "@vis.gl/react-google-maps";
import { YEMEN_CENTER } from "@/lib/yemen-geo";
import { GOOGLE_MAPS_KEY, hasValidMapsKey } from "./GoogleMapView";
import { Navigation, Loader2 } from "lucide-react";
import LocationPickerInner from "./LocationPickerInner";

export function GoogleLocationPicker({
  lat,
  lng,
  onChange,
  height = 300,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const [locating, setLocating] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const handleAuthFailure = () => {
      setAuthError(true);
    };
    window.addEventListener("google-maps-auth-failure", handleAuthFailure);
    return () => {
      window.removeEventListener("google-maps-auth-failure", handleAuthFailure);
    };
  }, []);

  const position =
    lat != null && lng != null ? { lat, lng } : { lat: YEMEN_CENTER.lat, lng: YEMEN_CENTER.lng };

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      onChange(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  };

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }, [onChange]);

  if (!hasValidMapsKey || authError) {
    return <LocationPickerInner lat={lat} lng={lng} onChange={onChange} height={height} />;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height }}>
      <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={position}
          center={position}
          defaultZoom={lat != null ? 14 : 7}
          onClick={handleMapClick}
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          style={{ width: "100%", height: "100%" }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {lat != null && lng != null && (
            <AdvancedMarker position={{ lat, lng }}>
              <Pin
                background="#2563eb"
                borderColor="#ffffff"
                glyphColor="#ffffff"
                scale={1.1}
              />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border text-xs font-bold text-foreground shadow-sm hover:bg-background transition-colors"
        >
          {locating ? (
            <Loader2 className="size-3.5 animate-spin text-primary" />
          ) : (
            <Navigation className="size-3.5 text-primary" />
          )}
          <span>موقعي الحالي</span>
        </button>
      </div>

      <div className="absolute bottom-2 right-2 left-2 z-10 text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-background/90 backdrop-blur-sm border border-border text-[11px] text-muted-foreground shadow-sm">
          {lat != null && lng != null
            ? `الموقع المحدد: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
            : "انقر على الخريطة لتحديد مكان الفقدان أو العثور"}
        </div>
      </div>
    </div>
  );
}
