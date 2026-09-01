-- "Users can update their listings" had no WITH CHECK, so Postgres reused
-- its USING clause (auth.uid() = user_id) for both — meaning nothing
-- actually constrained which columns a seller could change. Any listing
-- owner could PATCH their own row directly via the REST API and set
-- status: 'active' themselves, completely bypassing the admin "Approve"
-- step the dashboard is built around.
--
-- This still lets sellers self-serve other status changes (marking a
-- listing sold, pulling it down) — it only blocks transitioning INTO
-- 'active', which stays admin-only via the separate "Admins can manage all
-- listings" policy (RLS policies for the same action are OR'd together, so
-- that policy still lets admins set it freely).
--
-- Run this once in the Supabase SQL Editor for your project.

drop policy if exists "Users can update their listings" on public.listings;

create policy "Users can update their listings" on public.listings for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    status <> 'active'
    or status = (select status from public.listings where id = listings.id)
  )
);
