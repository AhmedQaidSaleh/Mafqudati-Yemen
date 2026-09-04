export interface Governorate {
  id: number;
  name_ar: string;
  name_en?: string | null;
}

export interface District {
  id: number;
  governorate_id: number;
  name_ar: string;
  name_en?: string | null;
}

export interface Category {
  id: number;
  name_ar: string;
  slug: string;
  icon?: string | null;
  description_ar?: string | null;
}

export interface ReportImage {
  id?: string;
  url: string;
  public_id?: string;
  sort_order?: number;
}

export interface Profile {
  id?: string;
  firebase_uid?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: string;
  governorate?: string | null;
  district?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  created_at?: string;
  privacy_hide_contact?: boolean;
}

export interface Report {
  id: string;
  user_id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category_id?: number | null;
  governorate_id?: number | null;
  district_id?: number | null;
  neighborhood?: string | null;
  city?: string | null;
  location_text?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  color?: string | null;
  brand?: string | null;
  keywords?: string[] | null;
  notes?: string | null;
  secret_verification_mark?: string | null;
  incident_date?: string | null;
  contact_preference?: "phone" | "messages" | "both";
  status: "active" | "resolved" | "closed" | "new";
  view_count?: number;
  reward_amount?: number | string | null;
  age?: string | null;
  gender?: string | null;
  clothes_description?: string | null;
  health_condition?: string | null;
  emergency_phone?: string | null;
  is_humanitarian?: boolean;
  sightings?: ReportSighting[];
  created_at: string;
  updated_at?: string;
  report_images?: ReportImage[];
  categories?: { name_ar: string; slug?: string } | null;
  governorates?: { name_ar: string } | null;
  districts?: { name_ar: string } | null;
  profile?: Profile | null;
}

export interface ReportSighting {
  id: string;
  report_id: string;
  user_id?: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  sighting_time?: string | null;
  location_text: string;
  latitude?: string | null;
  longitude?: string | null;
  notes: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: "match" | "message" | "system" | "watch";
  title: string;
  body?: string | null;
  link?: string | null;
  read?: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface MessageItem {
  id: string;
  report_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read_at?: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
  receiver?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
}

export interface AiMatch {
  id: string;
  score: number;
  reasons: string[];
}

export interface ExtractedReport {
  title: string;
  category_slug: string | null;
  color: string | null;
  governorate_name: string | null;
  district_name: string | null;
  location_text: string | null;
  incident_date: string | null;
  brand: string | null;
  keywords: string[];
  notes: string | null;
}
