import { supabase } from './lib/supabase.js'

export const SITE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL}`
    : ''

const iconSvg = (paths) =>
  `<svg class="cat-svg" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`

const CATEGORY_ICONS = {
  // Engine block with valve cover cap, timing pulley, and bellhousing
  engine: iconSvg(
    `<path d="M13 8h10M18 8v3M9.5 14h3l2-3h8.5l2 3h1.5a2 2 0 0 1 2 2v1.5H31v7h-2.5V26a2 2 0 0 1-2 2h-3.5l-2 2h-7l-2-2H9.5a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z"/><path d="M4.5 16.5v8M4.5 20.5h3M13.5 18.5h9M15 22.5h6"/>`,
  ),
  // Car door body panel with window cutout, handle, and character line
  body: iconSvg(
    `<path d="M6 27.5V19a2.5 2.5 0 0 1 .5-1.5l5.8-8.2A2.2 2.2 0 0 1 14.1 8.5H28a2 2 0 0 1 2 2v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"/><path d="M10.5 18 14.3 12.2H26.5V18H10.5Z"/><path d="M22.5 21.5h4M9.5 25.8h17"/>`,
  ),
  // Motorsport bucket seat profile with headrest bolster and slider rail
  interior: iconSvg(
    `<path d="M9.5 6.5a2.3 2.3 0 0 1 2.2-1.8h1.8a2 2 0 0 1 2 1.7l2.2 13.6h9.8a2.5 2.5 0 0 1 2.5 2.5v.8a2.5 2.5 0 0 1-2.5 2.5H13.5a2.8 2.8 0 0 1-2.7-2.2L7.7 9.5a3 3 0 0 1 1.8-3Z"/><path d="M11.6 10.5l.9 4.5M11 30.5h17M14.5 25.8v4.7M24.5 25.8v4.7"/>`,
  ),
  // Coilover suspension strut with top camber mount, helical spring, locking collars, and eyelet
  suspension: iconSvg(
    `<path d="M11 6.5h14M14 4.5v2M22 4.5v2M18 6.5v3.2M12.5 9.7h11"/><path d="M13 12.6 23 11M13 16 23 14.4M13 19.4 23 17.8M13 22.8 23 21.2"/><path d="M13 24.4h10M13 26.6h10M15.8 26.6v1.8M20.2 26.6v1.8"/><circle cx="18" cy="30.6" r="2.2"/>`,
  ),
  // 12V car battery with terminals, polarity marks, and spark bolt
  electrical: iconSvg(
    `<rect x="5" y="10.5" width="26" height="19" rx="2"/><path d="M5 14.5h26M9.5 10.5V7.5h4v3M22.5 10.5V7.5h4v3"/><path d="M19 16.8 15.6 22h2.8l-1.4 4.8 3.8-5.4h-2.8l1-4.6Z"/><path d="M8.8 19h3M24.2 19h3M25.7 17.5v3"/>`,
  ),
  // 5-spoke motorsport alloy wheel & tire
  wheels: iconSvg(
    `<circle cx="18" cy="18" r="13"/><circle cx="18" cy="18" r="9.8"/><circle cx="18" cy="18" r="2.8"/><path d="M18 15.2V8.2M20.7 17.1l6.6-2.2M19.7 20.3l4.1 5.6M16.3 20.3l-4.1 5.6M15.3 17.1l-6.6-2.2"/>`,
  ),
}

// [number, display name, icon, canonical lowercase slug value, DB category value]
export const CATEGORIES = [
  ['01', 'Dzinējs', CATEGORY_ICONS.engine, 'dzinējs', 'Dzinējs'],
  ['02', 'Virsbūve', CATEGORY_ICONS.body, 'virsbūve', 'Virsbūve'],
  ['03', 'Salons', CATEGORY_ICONS.interior, 'salons', 'Salons'],
  ['04', 'Balstiekārta', CATEGORY_ICONS.suspension, 'balstiekārta', 'Balstiekārta'],
  ['05', 'Elektrība', CATEGORY_ICONS.electrical, 'elektrība', 'Elektrība'],
  ['06', 'Riteņi & diski', CATEGORY_ICONS.wheels, 'riteņi un diski', 'Riteņi un diski'],
]

export const CONDITION_NAMES = {
  very_good: 'Ļoti labs',
  good: 'Labs',
  defect: 'Ar defektu',
}

export const LISTING_STATUS_NAMES = {
  pending: 'Gaida apstiprinājumu',
  active: 'Aktīvs',
  reserved: 'Rezervēts',
  sold: 'Pārdots',
  removed: 'Noņemts',
}

export const ORDER_STATUS_NAMES = {
  pending: 'Gaida apstiprinājumu',
  paid: 'Apmaksāts',
  shipped: 'Nosūtīts',
  completed: 'Pabeigts',
  cancelled: 'Atcelts',
}

export const ROUTE_TITLES = {
  home: 'TrackApart — Auto detaļas bez liekām rūpēm',
  catalog: 'Katalogs — TrackApart',
  listings: 'Kopienas sludinājumi — TrackApart',
  about: 'Par mums — TrackApart',
  contact: 'Kontakti — TrackApart',
  account: 'Mans konts — TrackApart',
  sell: 'Pārdot detaļu — TrackApart',
  terms: 'Lietošanas noteikumi — TrackApart',
  privacy: 'Privātuma politika — TrackApart',
  marketplace: 'Tirdzniecības noteikumi — TrackApart',
  safety: 'Drošība — TrackApart',
  admin: 'Admin panel — TrackApart',
  notFound: 'Lapa nav atrasta — TrackApart',
}

export const ROUTE_TITLES_EN = {
  home: 'TrackApart — Car parts without the hassle',
  catalog: 'Catalog — TrackApart',
  listings: 'Community listings — TrackApart',
  about: 'About us — TrackApart',
  contact: 'Contact — TrackApart',
  account: 'My account — TrackApart',
  sell: 'Sell a part — TrackApart',
  terms: 'Terms of use — TrackApart',
  privacy: 'Privacy policy — TrackApart',
  marketplace: 'Marketplace rules — TrackApart',
  safety: 'Safety — TrackApart',
  admin: 'Admin panel — TrackApart',
  notFound: 'Page not found — TrackApart',
}

let products = []
let productsLoaded = false
let resolveProductsReady = null
const productsReadyPromise = new Promise((resolve) => {
  resolveProductsReady = resolve
})

export function getProducts() {
  return products
}

export function isProductsLoaded() {
  return productsLoaded
}

export function whenProductsReady() {
  return productsLoaded ? Promise.resolve(products) : productsReadyPromise
}

export async function loadProducts() {
  try {
    if (!supabase) {
      productsLoaded = true
      return products
    }
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (!error) products = data || []
    productsLoaded = true
    return products
  } finally {
    productsLoaded = true
    resolveProductsReady?.(products)
  }
}
