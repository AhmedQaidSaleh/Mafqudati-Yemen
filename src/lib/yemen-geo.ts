// Coordinates and geography helpers for Yemen

export interface GovernorateGeo {
  id: number;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const YEMEN_CENTER = { lat: 15.3694, lng: 44.191 }; // Sana'a default center
export const YEMEN_BOUNDS = {
  north: 19.0,
  south: 12.0,
  east: 54.5,
  west: 41.5,
};

export const YEMEN_GOVERNORATES_GEO: Record<number, GovernorateGeo> = {
  1: {
    id: 1,
    name_ar: "أمانة العاصمة",
    name_en: "Amanat Al Asimah",
    lat: 15.3547,
    lng: 44.2066,
    zoom: 12,
  },
  2: { id: 2, name_ar: "صنعاء", name_en: "Sana'a", lat: 15.2, lng: 44.3, zoom: 10 },
  3: { id: 3, name_ar: "عدن", name_en: "Aden", lat: 12.7855, lng: 45.0187, zoom: 12 },
  4: { id: 4, name_ar: "تعز", name_en: "Taiz", lat: 13.5776, lng: 44.0206, zoom: 11 },
  5: { id: 5, name_ar: "الحديدة", name_en: "Al Hudaydah", lat: 14.7978, lng: 42.9545, zoom: 11 },
  6: { id: 6, name_ar: "إب", name_en: "Ibb", lat: 13.9667, lng: 44.1667, zoom: 11 },
  7: { id: 7, name_ar: "ذمار", name_en: "Dhamar", lat: 14.5427, lng: 44.4051, zoom: 11 },
  8: { id: 8, name_ar: "حضرموت", name_en: "Hadhramaut", lat: 15.9333, lng: 49.1667, zoom: 9 },
  9: { id: 9, name_ar: "مأرب", name_en: "Marib", lat: 15.4623, lng: 45.3258, zoom: 11 },
  10: { id: 10, name_ar: "صعدة", name_en: "Saada", lat: 16.9402, lng: 43.7639, zoom: 10 },
  11: { id: 11, name_ar: "حجة", name_en: "Hajjah", lat: 15.6942, lng: 43.6033, zoom: 10 },
  12: { id: 12, name_ar: "المهرة", name_en: "Al Mahrah", lat: 16.5, lng: 51.8, zoom: 9 },
  13: { id: 13, name_ar: "شبوة", name_en: "Shabwah", lat: 14.5333, lng: 46.8333, zoom: 9 },
  14: { id: 14, name_ar: "أبين", name_en: "Abyan", lat: 13.5833, lng: 45.8333, zoom: 10 },
  15: { id: 15, name_ar: "لحج", name_en: "Lahij", lat: 13.1667, lng: 44.8333, zoom: 10 },
  16: { id: 16, name_ar: "الضالع", name_en: "Al Dhale'e", lat: 13.6958, lng: 44.7314, zoom: 11 },
  17: { id: 17, name_ar: "عمران", name_en: "Amran", lat: 15.6594, lng: 43.9439, zoom: 11 },
  18: { id: 18, name_ar: "البيضاء", name_en: "Al Bayda", lat: 13.9852, lng: 45.5727, zoom: 10 },
  19: { id: 19, name_ar: "ريمة", name_en: "Raymah", lat: 14.6333, lng: 43.7167, zoom: 11 },
  20: { id: 20, name_ar: "الجوف", name_en: "Al Jawf", lat: 16.5, lng: 45.2, zoom: 9 },
  21: { id: 21, name_ar: "سقطرى", name_en: "Socotra", lat: 12.4634, lng: 53.8237, zoom: 10 },
  22: { id: 22, name_ar: "المحويت", name_en: "Al Mahwit", lat: 15.47, lng: 43.54, zoom: 11 },
};

/**
 * Resolves a report's lat/lng coordinates.
 * Returns exact lat/lng if provided, or deterministic jittered governorate center
 * so multiple reports in the same governorate don't stack on top of each other.
 */
export function getReportCoordinates(report: {
  id: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  governorate_id?: number | null;
}): { lat: number; lng: number } {
  const rawLat = report.latitude ? Number(report.latitude) : null;
  const rawLng = report.longitude ? Number(report.longitude) : null;

  if (rawLat && rawLng && !isNaN(rawLat) && !isNaN(rawLng)) {
    return { lat: rawLat, lng: rawLng };
  }

  // Fallback to governorate coordinates with subtle deterministic offset
  const govId = report.governorate_id ?? 1;
  const gov = YEMEN_GOVERNORATES_GEO[govId] || YEMEN_GOVERNORATES_GEO[1];

  // Deterministic pseudo-random offset based on report ID hash
  let hash = 0;
  for (let i = 0; i < report.id.length; i++) {
    hash = (hash << 5) - hash + report.id.charCodeAt(i);
    hash |= 0;
  }
  const offsetLat = ((Math.abs(hash) % 100) - 50) * 0.0005;
  const offsetLng = ((Math.abs(hash >> 3) % 100) - 50) * 0.0005;

  return {
    lat: gov.lat + offsetLat,
    lng: gov.lng + offsetLng,
  };
}
