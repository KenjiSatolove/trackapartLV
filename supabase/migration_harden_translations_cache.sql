-- Caps the size of rows a fully-anonymous client can write into the shared
-- translation cache. "Public can contribute translations" (insert with
-- check (true), see migration_translations_cache.sql) has no auth
-- requirement by design — any visitor with the English toggle on primes the
-- cache for everyone else — but that also means anyone can insert
-- arbitrarily large garbage rows with no rate limiting. Real product/listing
-- text (names, descriptions) never approaches these lengths, so this only
-- blocks storage-abuse, not legitimate use.
--
-- This does NOT fix the separate, harder issue that an anonymous client can
-- still preemptively insert a bogus translation for any known product/
-- listing text before a real visitor ever triggers translation of it (the
-- app does a plain insert, so it can't overwrite an *existing* cached row,
-- but it never verifies a submitted translation actually came from the
-- MyMemory API call). Closing that properly means moving the write behind a
-- server-side Edge Function that calls the translation API itself instead
-- of trusting a client-submitted pair — flagging for a future pass, since
-- this project has no Edge Functions yet.
--
-- Run this once in the Supabase SQL Editor for your project (after
-- migration_translations_cache.sql). Safe to run more than once.

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'translations_cache'
      and constraint_name = 'translations_cache_source_text_length'
  ) then
    alter table public.translations_cache
      add constraint translations_cache_source_text_length check (char_length(source_text) <= 2000);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'translations_cache'
      and constraint_name = 'translations_cache_translated_text_length'
  ) then
    alter table public.translations_cache
      add constraint translations_cache_translated_text_length check (char_length(translated_text) <= 2000);
  end if;
end $$;
