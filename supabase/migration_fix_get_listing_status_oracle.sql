-- Live pentest found that get_listing_status() (added in
-- migration_fix_rls_self_reference_bugs.sql, a SECURITY DEFINER function
-- used inside the listings UPDATE policy's WITH CHECK) is directly
-- callable as an RPC by anyone: `POST /rest/v1/rpc/get_listing_status`
-- with any listing id returns its real status — including for
-- pending/removed listings that direct SELECT on listings correctly hides
-- via RLS. Confirmed live: an anonymous SELECT on a hidden listing
-- returned `[]`, but calling this RPC for the same id returned "pending"
-- straight through.
--
-- The function is only ever invoked from the listings UPDATE policy, where
-- the caller already owns the row being checked (the policy's USING
-- clause already requires auth.uid() = user_id) — so scoping it to only
-- return status for listings the caller owns, or that are already public
-- (status = 'active'), fully preserves its real use case while closing
-- the oracle for every other id.
--
-- Run this once in the Supabase SQL Editor for your project.

create or replace function public.get_listing_status(target_id bigint)
returns text language sql stable security definer set search_path = public
as $$
  select status from public.listings
  where id = target_id and (auth.uid() = user_id or status = 'active')
$$;
