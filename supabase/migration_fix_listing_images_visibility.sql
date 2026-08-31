-- listing_images had an unconditional public SELECT policy, so anyone could
-- read image storage_paths for listings in ANY status (pending/reserved/sold/
-- removed), not just 'active' ones — bypassing the visibility rule already
-- enforced on the listings table itself. This makes the two consistent.
--
-- Run this once in the Supabase SQL Editor for your project. Safe to run
-- independently of the other pending migrations.

drop policy if exists "Public can view listing images" on public.listing_images;
create policy "Public can view listing images" on public.listing_images for select using (
  exists (
    select 1 from public.listings
    where id = listing_images.listing_id
      and (status = 'active' or auth.uid() = user_id)
  )
);
