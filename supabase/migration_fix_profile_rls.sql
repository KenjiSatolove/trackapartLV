-- Fixes the security gap where every user's phone number and display name
-- were publicly readable, regardless of whether they had an active listing.
-- Run this once in the Supabase SQL Editor for your project.

drop policy if exists "Public can view seller profiles" on public.profiles;

create policy "Public can view active sellers" on public.profiles for select using (
  exists (select 1 from public.listings where user_id = profiles.id and status = 'active')
);
