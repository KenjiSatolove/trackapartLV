-- A shared cache for machine-translated product/listing text, so the
-- first visitor who views something in English pays the translation
-- API call and everyone after gets it instantly from here.
--
-- Run this once in the Supabase SQL Editor for your project.

create table if not exists public.translations_cache (
  source_text text primary key,
  translated_text text not null,
  created_at timestamptz not null default now()
);

alter table public.translations_cache enable row level security;

drop policy if exists "Public can read translation cache" on public.translations_cache;
create policy "Public can read translation cache" on public.translations_cache for select using (true);

drop policy if exists "Public can contribute translations" on public.translations_cache;
create policy "Public can contribute translations" on public.translations_cache for insert with check (true);
