-- Restores the "Admins can view all profiles" policy defined in schema.sql
-- (select using public.is_admin()) but missing from production — schema.sql
-- was never fully applied as-is; the migration_*.sql files are the real
-- applied history. Without this policy, admins can only see their own
-- profile row through RLS, which would block any admin feature that needs
-- to look up another user's profile (user management, seller/KYBC review,
-- moderation lookups).
--
-- Run this once in the Supabase SQL Editor for your project (after
-- migration_fix_profile_role_escalation.sql).

drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());
