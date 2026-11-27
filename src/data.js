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
  home: 'TrackParts — Auto detaļas bez liekām rūpēm',
  catalog: 'Katalogs — TrackParts',
  listings: 'Kopienas sludinājumi — TrackParts',
  about: 'Par mums — TrackParts',
  contact: 'Kontakti — TrackParts',
  account: 'Mans konts — TrackParts',
  sell: 'Pārdot detaļu — TrackParts',
  terms: 'Lietošanas noteikumi — TrackParts',
  privacy: 'Privātuma politika — TrackParts',
  marketplace: 'Tirdzniecības noteikumi — TrackParts',
  safety: 'Drošība — TrackParts',
  admin: 'Admin panel — TrackParts',
  notFound: 'Lapa nav atrasta — TrackParts',
}

export const ROUTE_TITLES_EN = {
  home: 'TrackParts — Car parts without the hassle',
  catalog: 'Catalog — TrackParts',
  listings: 'Community listings — TrackParts',
  about: 'About us — TrackParts',
  contact: 'Contact — TrackParts',
  account: 'My account — TrackParts',
  sell: 'Sell a part — TrackParts',
  terms: 'Terms of use — TrackParts',
  privacy: 'Privacy policy — TrackParts',
  marketplace: 'Marketplace rules — TrackParts',
  safety: 'Safety — TrackParts',
  admin: 'Admin panel — TrackParts',
  notFound: 'Page not found — TrackParts',
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
