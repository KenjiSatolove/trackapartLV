-- "Users can update own reviews" had no WITH CHECK, so Postgres reused its
-- USING clause (auth.uid() = reviewer_id) for both — nothing constrained
-- which columns could change. A user could UPDATE their own review row and
-- retarget its seller_id to a different seller entirely, sidestepping the
-- insert-time "can't review yourself" check (which only ever runs on
-- INSERT, not UPDATE).
--
-- Run this once in the Supabase SQL Editor for your project.

drop policy if exists "Users can update own reviews" on public.reviews;

create policy "Users can update own reviews" on public.reviews for update
using (auth.uid() = reviewer_id)
with check (
  auth.uid() = reviewer_id
  and seller_id = (select seller_id from public.reviews where id = reviews.id)
);
