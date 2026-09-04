import { useState, useEffect, useCallback } from "react";
import { APIProvider, Map, InfoWindow } from "@vis.gl/react-google-maps";
import { Link } from "@tanstack/react-router";
import { MapPin, Eye, RotateCcw, Navigation, Loader2, AlertCircle, Tag } from "lucide-react";
import { api } from "@/client/api/client";
import type { Report } from "@/types/models";
import { YEMEN_CENTER, getReportCoordinates } from "@/lib/yemen-geo";
import { GOOGLE_MAPS_KEY, hasValidMapsKey } from "./GoogleMapView";
import { ApiKeyPrompt } from "./ApiKeyPrompt";
import { ClusteredReportMarkers } from "./ClusteredReportMarkers";

export interface ReportsMapProps {
  className?: string;
  height?: string | number;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  filterType?: "all" | "lost" | "found";
  governorateId?: number | null;
  onMarkerClick?: (report: Report) => void;
}

export function ReportsMap({
  className = "",
  height = "600px",
  initialCenter = YEMEN_CENTER,
  initialZoom = 7,
  filterType = "all",
  governorateId = null,
  onMarkerClick,
}: ReportsMapProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(initialCenter);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [locating, setLocating] = useState(false);

  // Fetch reports from /api/reports
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchReports = async () => {
      try {
        const params: Record<string, unknown> = {};
        if (filterType !== "all") {
          params.type = filterType;
        }
        if (governorateId) {
          params.governorate_id = governorateId;
        }

        const data = await api.get<Report[]>("/reports", params);
        if (isMounted) {
          setReports(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch reports for map:", err);
          setError(err instanceof Error ? err.message : "فشل تحميل بيانات البلاغات");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [filterType, governorateId]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setZoom(13);
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

  const handleReset = useCallback(() => {
    setCenter(initialCenter);
    setZoom(initialZoom);
    setSelectedReport(null);
  }, [initialCenter, initialZoom]);

  if (!hasValidMapsKey || authError) {
    return (
      <ApiKeyPrompt
        title="تفعيل خريطة Google Maps للبلاغات"
        description={
          authError
            ? "تعذر التحقق من مفتاح Google Maps API (InvalidKeyMapError). يرجى التأكد من إضافة مفتاح صحيح وتفعيل مكتبة Maps JavaScript API في Google Cloud Console."
            : "لعرض الخريطة التفاعلية ونقاط البلاغات الجغرافية المباشرة من الخادم، يرجى تفعيل مفتاح Google Maps API."
        }
        className={className}
      />
    );
  }

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-border shadow-sm bg-muted/20 ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
      dir="rtl"
      id="reports-google-map-container"
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-background border border-border shadow-md text-xs font-semibold text-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>جاري جلب إحداثيات البلاغات من الخادم...</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && !loading && (
        <div className="absolute top-4 right-4 z-20 max-w-sm rounded-2xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2 shadow-md">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Map Controls */}
      <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          title="تحديد موقعي الحالي"
          aria-label="تحديد موقعي الحالي"
          className="size-10 rounded-2xl bg-background/90 hover:bg-background border border-border shadow-md flex items-center justify-center text-foreground transition-colors cursor-pointer"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <Navigation className="size-4 text-primary" />
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          title="إعادة ضبط الخريطة"
          aria-label="إعادة ضبط الخريطة"
          className="size-10 rounded-2xl bg-background/90 hover:bg-background border border-border shadow-md flex items-center justify-center text-foreground transition-colors cursor-pointer"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      {/* Map Header Status Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-xs border border-border px-3.5 py-1.5 rounded-2xl shadow-sm text-xs">
        <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-foreground">{reports.length}</span>
        <span className="text-muted-foreground">بلاغ مسجل</span>
      </div>

      {/* Google Map Instance */}
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
          {/* Clustered markers for reports fetched from /api/reports */}
          <ClusteredReportMarkers
            reports={reports}
            selectedReportId={selectedReport?.id}
            onSelectReport={(report) => {
              setSelectedReport(report as Report);
              if (onMarkerClick) onMarkerClick(report as Report);
            }}
            enableClustering={true}
          />

          {/* InfoWindow for selected report */}
          {selectedReport && (
            <InfoWindow
              position={getReportCoordinates(selectedReport)}
              onCloseClick={() => setSelectedReport(null)}
            >
              <div className="max-w-xs p-1 text-right font-sans" dir="rtl">
                {selectedReport.report_images && selectedReport.report_images.length > 0 && (
                  <img
                    src={selectedReport.report_images[0].url}
                    alt={selectedReport.title}
                    className="w-full h-24 object-cover rounded-xl mb-2"
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                      selectedReport.type === "lost" ? "bg-rose-500" : "bg-emerald-600"
                    }`}
                  >
                    {selectedReport.type === "lost" ? "مفقود" : "معثور عليه"}
                  </span>
                  {selectedReport.categories?.name_ar && (
                    <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Tag className="size-2.5" />
                      {selectedReport.categories.name_ar}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-xs text-foreground line-clamp-1 mb-1">
                  {selectedReport.title}
                </h4>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2.5">
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
                  className="inline-flex items-center justify-center w-full gap-1 text-xs font-bold bg-primary text-primary-foreground py-1.5 px-3 rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <span>عرض التفاصيل</span>
                  <Eye className="size-3.5" />
                </Link>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

export default ReportsMap;
