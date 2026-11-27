-- 1) Admin access & duplicate prevention for community listing reports.
--    Previously `public.reports` only had an INSERT policy, so admins could
--    not read or dismiss submitted reports via RLS, and users could spam
--    unlimited duplicate reports on the same listing.
--
-- 2) Narrow public profile lookup RPC (`get_public_profiles`) that returns
--    ONLY public display metadata (id, display_name, city, created_at) —
--    never phone, role, or username — for active sellers AND review authors.
--    Fixes reviewer names showing up as "Lietotājs" when a buyer who left a
--    review does not have an active listing of their own.
--
-- Run this once in the Supabase SQL Editor for your project. Safe to re-run.

drop policy if exists "Admins can view reports" on public.reports;
create policy "Admins can view reports" on public.reports
  for select using (public.is_admin());

drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports" on public.reports
  for delete using (public.is_admin());

create unique index if not exists reports_listing_reporter_unique
  on public.reports (listing_id, reporter_id)
  where reporter_id is not null;

create or replace function public.get_public_profiles(user_ids uuid[])
returns table (
  id uuid,
  display_name text,
  city text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.city, p.created_at
  from public.profiles p
  where p.id = any(user_ids)
    and (
      exists (select 1 from public.listings l where l.user_id = p.id and l.status = 'active')
      or exists (select 1 from public.reviews r where r.reviewer_id = p.id or r.seller_id = p.id)
    )
$$;
