import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/client/api/client";
import { AlertTriangle, ChevronLeft, Eye, MapPin, X, HeartHandshake } from "lucide-react";
import type { Report } from "@/types/models";

export function EmergencyBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: emergencyReports = [] } = useQuery({
    queryKey: ["emergency-active-reports"],
    queryFn: () => api.get<Report[]>("/reports/emergency/active"),
    refetchInterval: 30000, // check every 30s
  });

  if (dismissed || emergencyReports.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg border-b-2 border-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left / Title info */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-300"></span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-black/25 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-yellow-300">
                نداء إنساني طارئ • AMBER ALERT
              </span>
              <span className="text-xs sm:text-sm font-black">
                {emergencyReports.length === 1
                  ? "بلاغ نشط عن شخص مفقود في اليمن بحاجة لمساعدة عاجلة"
                  : `يوجد ${emergencyReports.length} بلاغات نشطة عن مفقودين بحاجة ماسة لمساعدتكم`}
              </span>
            </div>
          </div>

          {/* Active Missing Cards preview */}
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            {emergencyReports.slice(0, 3).map((rep) => {
              const img = rep.report_images?.[0]?.url;
              const locationStr = [rep.governorates?.name_ar, rep.districts?.name_ar]
                .filter(Boolean)
                .join("، ");

              return (
                <Link
                  key={rep.id}
                  to="/report/$id"
                  params={{ id: rep.id }}
                  className="group flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 transition text-white shrink-0 border border-white/20 backdrop-blur-xs"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={rep.title}
                      className="size-8 rounded-lg object-cover border border-white/40"
                    />
                  ) : (
                    <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                      <HeartHandshake className="size-4" />
                    </div>
                  )}
                  <div className="text-start">
                    <div className="text-xs font-black group-hover:underline line-clamp-1">
                      {rep.title}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/90">
                      <MapPin className="size-2.5" />
                      <span>{locationStr || "اليمن"}</span>
                      {rep.age && <span>• {rep.age}</span>}
                    </div>
                  </div>
                  <Eye className="size-3.5 text-yellow-300 group-hover:scale-110 transition shrink-0" />
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="إغلاق التنبيه"
              className="rounded-lg p-1 text-white/80 hover:bg-black/20 hover:text-white transition shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
