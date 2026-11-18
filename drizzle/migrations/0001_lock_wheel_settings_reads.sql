DROP POLICY IF EXISTS "Anyone can read wheel settings" ON public.wheel_settings;
REVOKE SELECT ON public.wheel_settings FROM anon, authenticated;
GRANT ALL ON public.wheel_settings TO service_role;