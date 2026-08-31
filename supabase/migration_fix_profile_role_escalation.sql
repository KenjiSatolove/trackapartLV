-- Fixes a privilege-escalation bug: "Users can manage own profile" was a
-- FOR ALL policy that let any authenticated user INSERT/UPDATE/DELETE their
-- own profile row with no column restrictions. Because `role` lives on that
-- same row and gates admin access (owner/manager/warehouse/fulfillment), a
-- regular user could simply UPDATE their own role to 'owner' and get full
-- admin permissions. The same policy's DELETE grant made this worse: even
-- with an update-only fix, a user could delete their own profile row and
-- re-insert it with an elevated role, since the profile-creation trigger
-- (handle_new_user, see migration_products_and_signup.sql) only fires on
-- auth.users INSERT, not on public.profiles DELETE.
--
-- The app never inserts or deletes profile rows from the client (profile
-- creation goes through the security-definer handle_new_user trigger,
-- account deletion goes through the security-definer delete_own_account()
-- function), so this fix does not replace the dropped policy's insert/delete
-- grants with anything — regular users get select + update only, and update
-- cannot change `role`.
--
-- Run this once in the Supabase SQL Editor for your project (after
-- schema.sql and migration_fix_profile_rls.sql).

drop policy if exists "Users can manage own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );
