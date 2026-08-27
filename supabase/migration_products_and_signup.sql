-- Fixes two real bugs and adds a real products table for the admin panel:
--
-- 1) No profile row was ever created when someone signed up, so the admin
--    dashboard's "does this user have an admin role" check always failed
--    (it looks up public.profiles by the user's id, and that row never
--    existed). This adds a trigger that creates the profile automatically,
--    and backfills profiles for any accounts that already signed up before
--    this migration ran.
-- 2) The storefront's "official" catalog was a hardcoded list in the JS
--    file, so the admin Products tab had nothing real to edit. This adds a
--    products table (public read, admin-only write) and seeds it with the
--    same 7 demo products that were previously hardcoded.
--
-- Safe to run more than once. Run this in the Supabase SQL Editor after
-- schema.sql, migration_fix_profile_rls.sql and migration_add_orders.sql.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create a profile for every account that signed up before this
-- trigger existed (this is why admin login "didn't work" for accounts made
-- before running this migration).
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

create table if not exists public.products (
  id text primary key,
  name text not null,
  type text not null default 'Lietota detaļa',
  price numeric(10, 2) not null check (price >= 0),
  code text,
  oem text,
  manufacturer text,
  brand text,
  model text,
  production_year text,
  engine text,
  category text not null,
  condition text,
  stock integer not null default 1 check (stock >= 0),
  location text,
  weight text,
  dimensions text,
  warranty text,
  image text,
  tag text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Public can view products" on public.products;
create policy "Public can view products" on public.products for select using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

insert into public.products (id, name, type, price, code, oem, manufacturer, brand, model, production_year, engine, category, condition, stock, location, weight, dimensions, warranty, image, tag, description) values
('bmw-f10-left-light', 'BMW F10 priekšējais kreisais lukturis', 'Lietota detaļa', 249, 'USED-BMW-F10-00152', '63117203298', 'BMW Original', 'BMW', '5. sērija F10', '2010–2017', '530d 3.0 D', 'Virsbūve', 'Ļoti labs', 1, 'Plaukts B3 / 2. rinda', '4.2 kg', '78 × 32 × 28 cm', '3 mēneši', 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=85', 'Ļoti labs', 'Oriģināls BMW F10 priekšējais kreisais lukturis. Pārbaudīts, stikls bez plaisām, stiprinājumi veseli.'),
('bmw-e46-rear-axle', 'BMW E46 M3 aizmugurējais tilts', 'Lietota detaļa', 390, 'USED-BMW-E46-00881', '33312282479', 'BMW Original', 'BMW', '3. sērija E46 M3', '2000–2006', 'S54 3.2', 'Balstiekārta', 'Labs', 1, 'Plaukts C1 / 1. rinda', '38 kg', '145 × 55 × 50 cm', '3 mēneši', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85', 'Pēdējais gabals', 'Pilns E46 M3 aizmugurējais tilts ar diferenciāli. Piemērots restaurācijai vai trases projektam.'),
('audi-a4-turbo', 'Audi A4 B8 2.0 TDI turbīna', 'Lietota detaļa', 185, 'USED-AUD-B8-00304', '03L145702J', 'Garrett', 'Audi', 'A4 B8', '2008–2015', '2.0 TDI 105 kW', 'Dzinējs', 'Pārbaudīta', 1, 'Plaukts A2 / 4. rinda', '9.5 kg', '35 × 32 × 30 cm', '1 mēnesis', 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85', 'Pārbaudīta', 'Audi 2.0 TDI turbokompresors. Vārpsta pārbaudīta, bez liekas brīvkustības.'),
('mercedes-w204-caliper', 'Mercedes-Benz W204 AMG bremžu suports', 'Lietota detaļa', 129, 'USED-MER-W204-00027', '2044211381', 'Mercedes-Benz Original', 'Mercedes-Benz', 'C klase W204 AMG', '2007–2014', 'C63 AMG 6.2', 'Balstiekārta', 'Ļoti labs', 1, 'Plaukts D4 / 3. rinda', '8 kg', '32 × 24 × 22 cm', '3 mēneši', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85', 'Ļoti labs', 'AMG priekšējais bremžu suports. Notīrīts un pārbaudīts, gatavs uzstādīšanai.'),
('bmw-e46-seat', 'BMW E46 sporta priekšējais sēdeklis', 'Lietota detaļa', 160, 'USED-BMW-E46-00914', '52108239352', 'BMW Original', 'BMW', '3. sērija E46', '1998–2006', 'Visi benzīna', 'Salons', 'Labs', 1, 'Plaukts E1 / 2. rinda', '19 kg', '105 × 65 × 55 cm', '1 mēnesis', '', 'Labs', 'Sporta sēdeklis ar tīru audumu un veseliem stiprinājumiem.'),
('bmw-f10-control-module', 'BMW F10 komforta vadības bloks', 'Lietota detaļa', 85, 'USED-BMW-F10-00448', '61359202765', 'BMW Original', 'BMW', '5. sērija F10', '2010–2017', 'Visi', 'Elektrība', 'Pārbaudīts', 1, 'Plaukts A1 / 5. rinda', '0.6 kg', '22 × 16 × 7 cm', '1 mēnesis', '', 'Pārbaudīts', 'Komforta vadības modulis no strādājoša auto. Kods jāsalīdzina pirms pirkuma.'),
('mercedes-w204-wheel', 'Mercedes-Benz AMG 18 collu disks', 'Lietota detaļa', 220, 'USED-MER-W204-00218', '2044011602', 'AMG Original', 'Mercedes-Benz', 'C klase W204', '2007–2014', 'Visi', 'Riteņi un diski', 'Ļoti labs', 1, 'Plaukts F2 / 1. rinda', '12 kg', '58 × 58 × 25 cm', '1 mēnesis', '', 'Ļoti labs', 'Oriģināls 18 collu AMG disks. Pārbaudīts uz balansiera, taisns.')
on conflict (id) do nothing;
