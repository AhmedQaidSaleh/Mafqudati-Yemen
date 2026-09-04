import { useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useMap, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { MarkerClusterer, type Cluster } from "@googlemaps/markerclusterer";
import { getReportCoordinates } from "@/lib/yemen-geo";

export interface ReportItemForMap {
  id: string;
  title: string;
  type: "lost" | "found";
  governorate_id?: number | null;
  district_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  categories?: { name_ar?: string; icon?: string } | null;
  governorates?: { name_ar?: string } | null;
  districts?: { name_ar?: string } | null;
  report_images?: Array<{ url: string }> | null;
  [key: string]: unknown;
}

interface ClusteredReportMarkersProps {
  reports: ReportItemForMap[];
  selectedReportId?: string | null;
  onSelectReport: (report: ReportItemForMap) => void;
  enableClustering?: boolean;
}

interface ReportMarkerItemProps {
  report: ReportItemForMap;
  isSelected: boolean;
  onSelectReport: (report: ReportItemForMap) => void;
  setMarkerRef: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
}

const ReportMarkerItem = memo(function ReportMarkerItem({
  report,
  isSelected,
  onSelectReport,
  setMarkerRef,
}: ReportMarkerItemProps) {
  const coords = useMemo(() => getReportCoordinates(report), [report]);
  const isLost = report.type === "lost";
  const isHumanitarian = Boolean(
    report.is_humanitarian ||
    report.category_id === 9 ||
    report.categories?.name_ar?.includes("مفقودين") ||
    report.categories?.name_ar?.includes("إنساني")
  );

  const handleRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarkerRef(marker, report.id);
    },
    [setMarkerRef, report.id]
  );

  const handleClick = useCallback(() => {
    onSelectReport(report);
  }, [onSelectReport, report]);

  return (
    <AdvancedMarker
      ref={handleRef}
      position={coords}
      title={isHumanitarian ? `🚨 نداء إنساني عاجل: ${report.title}` : report.title}
      onClick={handleClick}
    >
      {isHumanitarian ? (
        <div className="relative flex items-center justify-center cursor-pointer group">
          <span className="absolute -inset-2 rounded-full bg-red-600/40 animate-ping" />
          <div
            className={`relative flex items-center justify-center rounded-full bg-red-600 border-2 border-white shadow-xl text-white font-extrabold transition-transform duration-200 group-hover:scale-125 ${
              isSelected ? "size-11 ring-4 ring-red-400 text-sm" : "size-9 text-xs"
            }`}
          >
            🚨
          </div>
        </div>
      ) : (
        <Pin
          background={isSelected ? "#2563eb" : isLost ? "#f43f5e" : "#059669"}
          borderColor="#ffffff"
          glyphColor="#ffffff"
          scale={isSelected ? 1.2 : 1.05}
        />
      )}
    </AdvancedMarker>
  );
});

export function ClusteredReportMarkers({
  reports,
  selectedReportId,
  onSelectReport,
  enableClustering = true,
}: ClusteredReportMarkersProps) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Custom cluster styling renderer for Google Maps Platform
  const customRenderer = useMemo(() => {
    return {
      render({ count, position }: Cluster) {
        if (typeof document === "undefined") {
          return null as unknown as google.maps.marker.AdvancedMarkerElement;
        }

        const clusterDiv = document.createElement("div");
        clusterDiv.setAttribute("role", "button");
        clusterDiv.setAttribute("aria-label", `تجمع يحتوي على ${count} بلاغات`);
        clusterDiv.className = "group cursor-pointer select-none transition-transform duration-200 hover:scale-110";

        // Determine badge style based on size
        const isLarge = count >= 20;
        const isMedium = count >= 5 && count < 20;
        const bgGradient = isLarge
          ? "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)"
          : isMedium
          ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
          : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)";

        const size = isLarge ? 46 : isMedium ? 40 : 36;

        clusterDiv.innerHTML = `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${bgGradient};
            color: #ffffff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 800;
            font-size: ${size >= 40 ? "13px" : "12px"};
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 0 0 3px #ffffff, 0 0 0 5px rgba(37, 99, 235, 0.25);
            cursor: pointer;
            direction: ltr;
          ">
            +${count}
          </div>
        `;

        if (typeof window !== "undefined" && window.google?.maps?.marker?.AdvancedMarkerElement) {
          return new window.google.maps.marker.AdvancedMarkerElement({
            position,
            content: clusterDiv,
            zIndex: 1000 + count,
          });
        }

        return new window.google.maps.Marker({
          position,
          label: { text: `+${count}`, color: "#ffffff", fontWeight: "bold" },
        });
      },
    };
  }, []);

  // Synchronize markers to clusterer without React re-renders
  const syncClusterer = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      if (!clustererRef.current) return;
      clustererRef.current.clearMarkers();
      if (enableClustering) {
        const markerList = Array.from(markersRef.current.values());
        if (markerList.length > 0) {
          clustererRef.current.addMarkers(markerList);
        }
      } else if (map) {
        markersRef.current.forEach((m) => {
          m.map = map;
        });
      }
    }, 20);
  }, [enableClustering, map]);

  // Initialize or update MarkerClusterer
  useEffect(() => {
    if (!map || typeof window === "undefined" || !MarkerClusterer) return;

    if (!enableClustering) {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
      markersRef.current.forEach((m) => {
        m.map = map;
      });
      return;
    }

    if (!clustererRef.current) {
      try {
        clustererRef.current = new MarkerClusterer({
          map,
          renderer: customRenderer,
          onClusterClick: (_event, cluster, targetMap) => {
            if (cluster.bounds) {
              targetMap.fitBounds(cluster.bounds, { top: 50, right: 50, bottom: 50, left: 50 });
            }
          },
        });
      } catch (err) {
        console.error("Failed to initialize MarkerClusterer:", err);
      }
    }

    syncClusterer();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
    };
  }, [map, enableClustering, customRenderer, syncClusterer]);

  // Clean up stale markers if reports list changes
  useEffect(() => {
    const validIds = new Set(reports.map((r) => r.id));
    let changed = false;
    for (const key of markersRef.current.keys()) {
      if (!validIds.has(key)) {
        markersRef.current.delete(key);
        changed = true;
      }
    }
    if (changed) {
      syncClusterer();
    }
  }, [reports, syncClusterer]);

  // Stable marker ref callback that does NOT trigger React state updates
  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
      if (marker) {
        if (markersRef.current.get(id) === marker) return;
        markersRef.current.set(id, marker);
        syncClusterer();
      } else {
        if (!markersRef.current.has(id)) return;
        markersRef.current.delete(id);
        syncClusterer();
      }
    },
    [syncClusterer]
  );

  return (
    <>
      {reports.map((report) => (
        <ReportMarkerItem
          key={report.id}
          report={report}
          isSelected={selectedReportId === report.id}
          onSelectReport={onSelectReport}
          setMarkerRef={setMarkerRef}
        />
      ))}
    </>
  );
}
