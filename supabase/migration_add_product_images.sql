-- Adds a second (and beyond) photo per catalog product. The storefront
-- already supports a gallery with multiple photos + lightbox for products
-- (it falls back to the single `image` column when `images` is empty), so
-- this only needs a new column plus backfilled data for the demo catalog.
--
-- Run this once in the Supabase SQL Editor for your project (after
-- migration_products_and_signup.sql).

alter table public.products add column if not exists images text[];

update public.products set
  image = 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=85',
  images = array[
    'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1683791737647-e3e6efb1e2f2?auto=format&fit=crop&w=900&q=85'
  ]
where id = 'bmw-f10-left-light';

update public.products set
  image = 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85',
  images = array[
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1760836395865-0c20fff2aefd?auto=format&fit=crop&w=900&q=85'
  ]
where id = 'bmw-e46-rear-axle';

update public.products set
  image = 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85',
  images = array[
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1768387666438-b3da75373846?auto=format&fit=crop&w=900&q=85'
  ]
where id = 'audi-a4-turbo';

update public.products set
  image = 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85',
  images = array[
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1759189901164-900e0afac895?auto=format&fit=crop&w=900&q=85'
  ]
where id = 'mercedes-w204-caliper';

update public.products set
  image = 'https://images.unsplash.com/photo-1652967786801-1b6ba8a00075?auto=format&fit=crop&w=900&q=85',
  images = array[
    'https://images.unsplash.com/photo-1652967786801-1b6ba8a00075?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1760161339261-56487b766a17?auto=format&fit=crop&w=900&q=85'
  ]
where id = 'bmw-e46-seat';

update public.products set
  image = 'https://images.unsplash.com/photo-1569615313731-7407da4f4594?auto=format&fit=crop&w=900&q=85',
  images = array[
    'https://images.unsplash.com/photo-1569615313731-7407da4f4594?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1765256931521-0f843b7b3100?auto=format&fit=crop&w=900&q=85'
  ]
where id = 'bmw-f10-control-module';

update public.products set
  image = 'https://images.unsplash.com/photo-1741366175071-3604c86ec475?auto=format&fit=crop&w=900&q=85',
  images = array[
    'https://images.unsplash.com/photo-1741366175071-3604c86ec475?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1768341396286-a6322d588111?auto=format&fit=crop&w=900&q=85'
  ]
where id = 'mercedes-w204-wheel';
