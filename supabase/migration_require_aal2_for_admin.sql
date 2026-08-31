-- The app's admin dashboard requires an aal2 (MFA-verified) session before
-- rendering, but that check lived only in src/main.js — every RLS policy
-- gating admin data calls is_admin(), which only ever checked profiles.role.
-- Someone with just a valid admin password (exactly the threat MFA exists
-- to mitigate) could skip the app entirely and hit the Supabase REST API
-- directly with an aal1 session; is_admin() would still say yes. This makes
-- is_admin() itself require aal2, so every policy that already depends on
-- it is fixed in one place — the database, not just the UI, now enforces MFA.
--
-- ⚠️ Run this only after confirming at least one admin account has
-- successfully completed TOTP enrollment and can pass the code-challenge
-- screen end-to-end — once this runs, is_admin() returns false for any
-- session that hasn't done that, blocking ALL admin-gated reads/writes
-- (products, orders, listings, profiles) via the API, not just the
-- dashboard UI.

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('owner', 'manager', 'warehouse', 'fulfillment')
  )
  and coalesce((auth.jwt() ->> 'aal'), '') = 'aal2'
$$;
