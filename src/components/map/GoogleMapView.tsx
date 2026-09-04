import { useState, useEffect, useMemo, useCallback } from "react";
import {
  APIProvider,
  Map,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { Link } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  Filter,
  Eye,
  Layers,
  Sparkles,
  RotateCcw,
  Navigation,
  Loader2,
  Calendar,
  AlertCircle,
  Component,
} from "lucide-react";
import type { Report, Category, Governorate } from "@/types/models";
import { YEMEN_CENTER, YEMEN_GOVERNORATES_GEO, getReportCoordinates } from "@/lib/yemen-geo";
import { ApiKeyPrompt } from "./ApiKeyPrompt";
import { ClusteredReportMarkers } from "./ClusteredReportMarkers";
import { PlacesAutocomplete } from "./PlacesAutocomplete";

// Helper to validate Google Maps Platform key structure
export function isGoogleMapsKeyValid(key?: string | null): boolean {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (
    !trimmed ||
    trimmed === "YOUR_API_KEY" ||
    trimmed.startsWith("AIzaSyFake") ||
    trimmed.length < 35
  ) {
    return false;
  }
  // Google Maps / Cloud API keys always start with AIza
  return trimmed.startsWith("AIza");
}

// Get key with fallbacks
export const GOOGLE_MAPS_KEY = (
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (typeof process !== "undefined" && (process.env?.GOOGLE_MAPS_PLATFORM_KEY || process.env?.GOOGLE_MAPS_API_KEY || process.env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || process.env?.VITE_GOOGLE_MAPS_API_KEY)) ||
  (globalThis as unknown as { GOOGLE_MAPS_PLATFORM_KEY?: string; GOOGLE_MAPS_API_KEY?: string }).GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as unknown as { GOOGLE_MAPS_PLATFORM_KEY?: string; GOOGLE_MAPS_API_KEY?: string }).GOOGLE_MAPS_API_KEY ||
  ""
)
  .split("&")[0]
  .trim();

export const hasValidMapsKey = isGoogleMapsKeyValid(GOOGLE_MAPS_KEY);

// Setup global auth failure handler to prevent unhandled Script errors
if (typeof window !== "undefined") {
  const prevAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    if (typeof prevAuthFailure === "function") {
      try {
        prevAuthFailure();
      } catch {
        // silent
      }
    }
    window.dispatchEvent(new CustomEvent("google-maps-auth-failure"));
  };
}

interface GoogleMapViewProps {
  reports: Report[];
  categories: Category[];
  governorates: Governorate[];
}

/**
 * Controller inside Google Map to reset center or locate
 */
function MapControls({
  onReset,
  onLocate,
  locating,
}: {
  onReset: () => void;
  onLocate: () => void;
  locating: boolean;
}) {
  return (
    <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2">
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        title="تحديد موقعي الحالي"
        className="size-10 rounded-2xl bg-background border border-border shadow-md flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
      >
        {locating ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : (
          <Navigation className="size-4" />
        )}
      </button>
      <button
        type="button"
        onClick={onReset}
        title="إعادة ضبط الخريطة لكل اليمن"
        className="size-10 rounded-2xl bg-background border border-border shadow-md flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}

export function GoogleMapView({ reports, categories, governorates }: GoogleMapViewProps) {
  const [selectedType, setSelectedType] = useState<"all" | "lost" | "found">("all");
  const [selectedGov, setSelectedGov] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [clusteringEnabled, setClusteringEnabled] = useState<boolean>(true);
  const [locating, setLocating] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(YEMEN_CENTER);
  const [zoom, setZoom] = useState<number>(7);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedType !== "all" && r.type !== selectedType) return false;
      if (selectedGov && r.governorate_id !== selectedGov) return false;
      if (selectedCat && r.category_id !== selectedCat) return false;
      return true;
    });
  }, [reports, selectedType, selectedGov, selectedCat]);

  // Handle governorate change
  const handleGovernorateChange = (govId: number | null) => {
    setSelectedGov(govId);
    if (govId && YEMEN_GOVERNORATES_GEO[govId]) {
      const geo = YEMEN_GOVERNORATES_GEO[govId];
      setCenter({ lat: geo.lat, lng: geo.lng });
      setZoom(geo.zoom);
    } else {
      setCenter(YEMEN_CENTER);
      setZoom(7);
    }
  };

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setZoom(12);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }, []);

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

  const handleResetMap = useCallback(() => {
    setSelectedGov(null);
    setCenter(YEMEN_CENTER);
    setZoom(7);
  }, []);

  if (!hasValidMapsKey || authError) {
    return (
      <ApiKeyPrompt
        title="تفعيل خريطة Google Maps Platform"
        description={
          authError
            ? "تعذر التحقق من مفتاح Google Maps API (InvalidKeyMapError). يرجى التأكد من إضافة مفتاح صحيح وتفعيل مكتبة Maps JavaScript API في Google Cloud Console."
            : "تم تجهيز تكامل Google Maps Platform بالكامل. لإظهار الخريطة التفاعلية ونقاط البلاغات، يرجى إضافة مفتاح GOOGLE_MAPS_PLATFORM_KEY."
        }
      />
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Filter Bar */}
      <div className="card-soft rounded-3xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Toggle */}
          <div className="inline-flex rounded-2xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedType === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              الكل ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("lost")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedType === "lost"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              المفقودات ({reports.filter((r) => r.type === "lost").length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("found")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedType === "found"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              المعثورات ({reports.filter((r) => r.type === "found").length})
            </button>
          </div>

          {/* Governorate Dropdown */}
          <select
            value={selectedGov ?? ""}
            onChange={(e) =>
              handleGovernorateChange(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="">جميع المحافظات</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name_ar}
              </option>
            ))}
          </select>

          {/* Category Dropdown */}
          <select
            value={selectedCat ?? ""}
            onChange={(e) => setSelectedCat(e.target.value ? Number(e.target.value) : null)}
            className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="">جميع التصنيفات</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_ar}
              </option>
            ))}
          </select>

          {/* Smart Clustering Toggle */}
          <button
            type="button"
            onClick={() => setClusteringEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all ${
              clusteringEnabled
                ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
            title="تفعيل أو تعطيل تجميع الدبابيس المتقاربة تلقائياً"
          >
            <Layers className="size-3.5" />
            <span>تجميع ذكي</span>
            <span
              className={`size-2 rounded-full ${
                clusteringEnabled ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
              }`}
            />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-rose-500 inline-block"></span>
            <span>مفقود</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-emerald-600 inline-block"></span>
            <span>معثور عليه</span>
          </div>
          <span className="text-foreground font-bold">{filteredReports.length} بلاغ ظاهر</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="card-soft rounded-3xl overflow-hidden border border-border relative h-[650px] w-full">
        <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
          <Map
            mapId="DEMO_MAP_ID"
            center={center}
            zoom={zoom}
            onCenterChanged={(ev) => setCenter(ev.detail.center)}
            onZoomChanged={(ev) => setZoom(ev.detail.zoom)}
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {/* Places Autocomplete Search Bar */}
            <div className="absolute top-4 right-4 z-20">
              <PlacesAutocomplete
                onSelectLocation={(lat, lng, z) => {
                  setCenter({ lat, lng });
                  setZoom(z);
                }}
              />
            </div>

            <MapControls onReset={handleResetMap} onLocate={handleLocateMe} locating={locating} />

            {/* Smart Clustered Advanced Markers */}
            <ClusteredReportMarkers
              reports={filteredReports}
              selectedReportId={selectedReport?.id}
              onSelectReport={(r) => setSelectedReport(r as Report)}
              enableClustering={clusteringEnabled}
            />

            {/* Info Window */}
            {selectedReport && (
              <InfoWindow
                position={getReportCoordinates(selectedReport)}
                onCloseClick={() => setSelectedReport(null)}
              >
                <div className="max-w-xs p-2 text-right font-sans" dir="rtl">
                  {selectedReport.report_images && selectedReport.report_images.length > 0 && (
                    <img
                      src={selectedReport.report_images[0].url}
                      alt={selectedReport.title}
                      className="w-full h-28 object-cover rounded-xl mb-2"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex items-center gap-1.5 mb-1">
                    {selectedReport.is_humanitarian || selectedReport.category_id === 9 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-600 text-white animate-pulse">
                        🚨 نداء إنساني عاجل
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                          selectedReport.type === "lost" ? "bg-rose-500" : "bg-emerald-600"
                        }`}
                      >
                        {selectedReport.type === "lost" ? "مفقود" : "معثور عليه"}
                      </span>
                    )}
                    {selectedReport.categories?.name_ar && (
                      <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                        {selectedReport.categories.name_ar}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-foreground line-clamp-1 mb-1">
                    {selectedReport.title}
                  </h3>

                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="size-3 text-primary shrink-0" />
                    <span>
                      {selectedReport.governorates?.name_ar || "اليمن"}
                      {selectedReport.districts?.name_ar
                        ? ` - ${selectedReport.districts.name_ar}`
                        : ""}
                    </span>
                  </div>

                  <Link
                    to="/report/$id"
                    params={{ id: selectedReport.id }}
                    className="inline-flex items-center justify-center w-full gap-1 text-xs font-bold bg-primary text-primary-foreground py-1.5 px-3 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <span>عرض التفاصيل الكاملة</span>
                    <Eye className="size-3.5" />
                  </Link>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
