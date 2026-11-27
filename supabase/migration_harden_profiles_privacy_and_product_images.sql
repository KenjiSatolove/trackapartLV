-- 1) Tightens `public.profiles` privacy: previously "Public can view active
--    sellers" exposed every column of an active seller's profile row (including
--    `role`, `username`, and bulk-scrapable `phone` numbers) to anonymous REST
--    API queries. Now direct public SELECT on `public.profiles` is removed, and
--    listing detail pages fetch ONLY (seller_id, display_name, phone) for a
--    single active listing via `get_listing_seller(target_listing_id)`.
--    Seller profile & reviewer display names continue using `get_public_profiles`
--    (which never returns `phone`, `role`, or `username`).
--
-- 2) Aligns `public.listings` INSERT policy with auto-publish: authenticated
--    users may insert listings with status 'active' or 'pending' for themselves.
--
-- 3) Creates the public `product-images` Storage bucket and admin-only write
--    policies so staff can upload catalog photos directly from the Admin panel.
--
-- Run this once in the Supabase SQL Editor for your project (after
-- migration_admin_reports_and_public_profiles.sql). Safe to re-run.

drop policy if exists "Public can view active sellers" on public.profiles;
drop policy if exists "Public can view seller profiles" on public.profiles;

create or replace function public.get_listing_seller(target_listing_id bigint)
returns table (
  seller_id uuid,
  display_name text,
  phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id as seller_id, p.display_name, p.phone
  from public.listings l
  join public.profiles p on p.id = l.user_id
  where l.id = target_listing_id
    and (l.status = 'active' or l.user_id = auth.uid() or public.is_admin())
  limit 1
$$;

drop policy if exists "Users can create listings" on public.listings;
create policy "Users can create listings" on public.listings
  for insert
  with check (
    auth.uid() = user_id
    and status in ('active', 'pending')
  );

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
