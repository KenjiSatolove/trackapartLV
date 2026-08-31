-- ⚠️ RUN THIS ONLY AFTER:
--   1. The translate-cache Edge Function has been deployed
--      (Dashboard → Edge Functions → Deploy a new function → paste
--      supabase/functions/translate-cache/index.ts), and
--   2. You've confirmed switching the site to English still works and
--      populates translations_cache via the deployed function.
--
-- translations_cache previously had a `with check (true)` insert policy, so
-- any anonymous client could write arbitrary source/translated pairs to the
-- shared cache directly via the REST API — poisoning what every visitor
-- sees. Writes now go through the translate-cache function using the
-- service role key, which bypasses RLS entirely, so this public insert
-- policy is no longer needed and only remains as an unguarded direct-write
-- path. Run this in the Supabase SQL Editor for your project.
--
-- This is independent of migration_lock_down_order_writes.sql — you can run
-- this one now without waiting on Turnstile/checkout.

drop policy if exists "Public can contribute translations" on public.translations_cache;
