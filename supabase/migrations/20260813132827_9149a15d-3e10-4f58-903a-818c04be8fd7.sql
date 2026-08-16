DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.governorate,
  p.created_at,
  CASE WHEN p.privacy_hide_contact THEN NULL ELSE p.phone END AS phone,
  p.privacy_hide_contact
FROM public.profiles p;

GRANT SELECT ON public.profiles_public TO anon, authenticated;