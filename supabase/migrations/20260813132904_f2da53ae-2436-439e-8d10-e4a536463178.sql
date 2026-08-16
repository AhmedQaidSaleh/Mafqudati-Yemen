DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  governorate text,
  created_at timestamptz,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.governorate, p.created_at,
         CASE WHEN p.privacy_hide_contact THEN NULL ELSE p.phone END
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;