-- A live pentest with a real non-admin test account found that BOTH the
-- profiles role-escalation fix (from a prior session) and the listings/
-- reviews self-reference fixes from this session's RLS audit are actually
-- broken, due to two related SQL bugs in their WITH CHECK clauses:
--
-- 1. profiles: `role = (select role from public.profiles where id = auth.uid())`
--    inside a WITH CHECK on profiles queries the SAME table its own policy
--    protects, as the calling (non-privileged) role — Postgres has to
--    re-apply profiles' RLS policies to evaluate that subquery, which
--    requires re-evaluating this same policy, so it detects the cycle and
--    errors with "infinite recursion detected in policy for relation
--    profiles" on EVERY update, not just role-escalation attempts. This
--    broke the account page's profile-save form for every single user.
--
-- 2. listings / reviews: `... where id = listings.id` (and the reviews
--    equivalent) inside a correlated subquery is ambiguous — the
--    subquery's own FROM is also `public.listings` / `public.reviews`
--    (unaliased), so the bare `listings.id` / `reviews.id` reference
--    resolves to the SUBQUERY's own row, not the outer row being checked,
--    making the WHERE clause a tautology (`id = id`) that matches every
--    row in the table. With more than one row present, Postgres errors
--    with "more than one row returned by a subquery used as an
--    expression" instead of comparing against the single correct row —
--    breaking every legitimate self-service status/rating change, not
--    just malicious ones (it happened to "fail closed" by accident, but
--    with a broken 500 instead of a clean rejection).
--
-- Fix: move each self-lookup into its own SECURITY DEFINER function,
-- mirroring the existing is_admin() pattern already used elsewhere in this
-- schema — a security-definer function's internal query runs as the
-- function owner (bypassing RLS on that internal read), which sidesteps
-- both the recursion and the naming-ambiguity issue, since the lookup
-- happens in its own query scope with an unambiguous parameter name.
--
-- Run this once in the Supabase SQL Editor for your project.

create or replace function public.get_own_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = public.get_own_role()
  );

create or replace function public.get_listing_status(target_id bigint)
returns text language sql stable security definer set search_path = public
as $$ select status from public.listings where id = target_id $$;

drop policy if exists "Users can update their listings" on public.listings;
create policy "Users can update their listings" on public.listings for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (status <> 'active' or status = public.get_listing_status(id))
);

create or replace function public.get_review_seller_id(target_id bigint)
returns uuid language sql stable security definer set search_path = public
as $$ select seller_id from public.reviews where id = target_id $$;

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews" on public.reviews for update
using (auth.uid() = reviewer_id)
with check (
  auth.uid() = reviewer_id
  and seller_id = public.get_review_seller_id(id)
);
