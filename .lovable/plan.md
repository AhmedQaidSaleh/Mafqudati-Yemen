## Plan: Turn Mafqudati into a fully functional app

I'll keep the current UI, routes, and design system exactly as-is and wire real backend + logic underneath. Because this is a large scope, I'll ship it in clear phases so the preview stays usable after every phase.

### Phase 0 — Backend foundation

- Enable Lovable Cloud (managed Postgres, Auth, Storage, server functions).
- Enable managed Google sign-in alongside email/password.
- Create storage buckets: `report-images` (public read), `avatars` (public read).

### Phase 1 — Database schema (single migration)

Tables (all with GRANTs + RLS + policies):

- `profiles` (id → auth.users, full_name, phone, avatar_url, governorate, district, city, neighborhood, notify_email, notify_push, privacy_hide_contact, created_at)
- `user_roles` + `app_role` enum + `has_role()` security-definer (per platform rules)
- `governorates`, `districts`, `cities`, `neighborhoods` (Yemen hierarchy, seeded with all 22 governorates + districts; cities/neighborhoods free-text fallback)
- `categories` (seeded: electronics, wallets, keys, documents, bags, vehicles, pets, other)
- `reports` (id, user_id, type: lost|found, title, description, category_id, governorate_id, district_id, city, neighborhood, lat, lng, incident_date, contact_preference, status: open|closed|resolved, reward_amount, view_count, created_at, updated_at)
- `report_images` (id, report_id, url, sort_order)
- `saved_reports` (user_id, report_id)
- `notifications` (id, user_id, type, title, body, link, read, created_at)
- `messages` (id, report_id, sender_id, receiver_id, body, read, created_at) — in-platform chat so phones stay hidden until user opts in
- Trigger `handle_new_user()` → auto-create profile on signup
- Trigger `updated_at` on reports

### Phase 2 — Auth wiring

- Add `/auth` public route (login + register tabs), `/reset-password` route.
- `SiteHeader` becomes session-aware: shows Login/Register when signed out, avatar menu + Logout when signed in.
- `_authenticated/route.tsx` managed gate.
- Move `/profile`, `/report/new`, `/notifications`, `/report/:id/edit` under `_authenticated/`.
- Root `onAuthStateChange` subscriber; sign-out hygiene per platform rules.
- Zod validation on every form.

### Phase 3 — Reports CRUD

- Server functions (`requireSupabaseAuth`): create/update/delete/close/duplicate report; upload/reorder/delete images; save/unsave.
- Public server fn: list & filter reports, get by id, list similar.
- Refactor existing pages to consume real data:
  - `/lost`, `/found` → filtered lists with pagination.
  - `/search` → keyword + category + governorate + district + status + date + type + sort (newest/nearest when geo available).
  - `/report/:id` → gallery, info, map, reporter (contact hidden behind "Request contact"), share, QR (via `qrcode` lib), similar reports, view counter.
  - `/report/new` → real submit with multi-image upload (client-side compression via `browser-image-compression`), map picker.
  - `/report/:id/edit` → edit flow.

### Phase 4 — Profile & notifications

- `/profile`: tabs — personal info, avatar upload, change password, my reports, saved reports, notification settings, privacy settings.
- `/notifications`: realtime list (Supabase realtime), mark read.
- In-app messaging thread on report detail page.

### Phase 5 — Map

- Add Leaflet + OpenStreetMap (free, no key). Reusable `<LocationPicker>` and `<LocationDisplay>` behind `<ClientOnly>` per platform rules. Yemen bounds default.

### Phase 6 — Polish

- Responsive audit on all new components.
- Loading/empty/error states.
- SEO head() per route including report detail dynamic og:image from first report image.

### Technical notes

- Stack: TanStack Start + Lovable Cloud (Supabase under the hood), TanStack Query for reads.
- Libraries to add: `leaflet`, `react-leaflet`, `qrcode`, `browser-image-compression`, `zod` (likely already), `date-fns`.
- No UI redesign, no homepage changes, no design-system changes — only new sub-components inside the current tokens/classes.

### Confirmations before I start

1. OK to enable **Lovable Cloud** (creates managed backend) and turn on **Google sign-in** in addition to email/password?
2. OK to use **Leaflet + OpenStreetMap** for the map (no API key, free) vs. Mapbox/Google (require paid keys)?
3. For messaging between users — build **in-app chat** (recommended, keeps phones private) or just a "reveal contact" button that shows phone after consent?
