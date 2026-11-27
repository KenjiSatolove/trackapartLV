import { supabase } from './lib/supabase.js'

export const SITE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL}`
    : ''

// [number, display name, icon, canonical lowercase slug value, DB category value]
export const CATEGORIES = [
  ['01', 'Dzinējs', '⚙', 'dzinējs', 'Dzinējs'],
  ['02', 'Virsbūve', '◒', 'virsbūve', 'Virsbūve'],
  ['03', 'Salons', '▣', 'salons', 'Salons'],
  ['04', 'Balstiekārta', '◈', 'balstiekārta', 'Balstiekārta'],
  ['05', 'Elektrība', 'ϟ', 'elektrība', 'Elektrība'],
  ['06', 'Riteņi & diski', '◉', 'riteņi un diski', 'Riteņi un diski'],
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
