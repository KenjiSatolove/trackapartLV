import { supabase } from './lib/supabase.js'

export const SITE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL}`
    : ''

export const FALLBACK_PRODUCTS = [
  {
    id: 'bmw-f10-left-light',
    name: 'BMW F10 priekšējais kreisais lukturis',
    type: 'Lietota detaļa',
    price: 249,
    code: 'USED-BMW-F10-00152',
    oem: '63117203298',
    manufacturer: 'BMW Original',
    brand: 'BMW',
    model: '5. sērija F10',
    production_year: '2010–2017',
    engine: '530d 3.0 D',
    category: 'Virsbūve',
    condition: 'Ļoti labs',
    stock: 1,
    location: 'Plaukts B3 / 2. rinda',
    weight: '4.2 kg',
    dimensions: '78 × 32 × 28 cm',
    warranty: '3 mēneši',
    image: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=85',
    images: [
      'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1683791737647-e3e6efb1e2f2?auto=format&fit=crop&w=900&q=85',
    ],
    tag: 'Ļoti labs',
    description: 'Oriģināls BMW F10 priekšējais kreisais lukturis. Pārbaudīts, stikls bez plaisām, stiprinājumi veseli.',
  },
  {
    id: 'bmw-e46-rear-axle',
    name: 'BMW E46 M3 aizmugurējais tilts',
    type: 'Lietota detaļa',
    price: 390,
    code: 'USED-BMW-E46-00881',
    oem: '33312282479',
    manufacturer: 'BMW Original',
    brand: 'BMW',
    model: '3. sērija E46 M3',
    production_year: '2000–2006',
    engine: 'S54 3.2',
    category: 'Balstiekārta',
    condition: 'Labs',
    stock: 1,
    location: 'Plaukts C1 / 1. rinda',
    weight: '38 kg',
    dimensions: '145 × 55 × 50 cm',
    warranty: '3 mēneši',
    image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85',
    images: [
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1760836395865-0c20fff2aefd?auto=format&fit=crop&w=900&q=85',
    ],
    tag: 'Pēdējais gabals',
    description: 'Pilns E46 M3 aizmugurējais tilts ar diferenciāli. Piemērots restaurācijai vai trases projektam.',
  },
  {
    id: 'audi-a4-turbo',
    name: 'Audi A4 B8 2.0 TDI turbīna',
    type: 'Lietota detaļa',
    price: 185,
    code: 'USED-AUD-B8-00304',
    oem: '03L145702J',
    manufacturer: 'Garrett',
    brand: 'Audi',
    model: 'A4 B8',
    production_year: '2008–2015',
    engine: '2.0 TDI 105 kW',
    category: 'Dzinējs',
    condition: 'Pārbaudīta',
    stock: 1,
    location: 'Plaukts A2 / 4. rinda',
    weight: '9.5 kg',
    dimensions: '35 × 32 × 30 cm',
    warranty: '1 mēnesis',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85',
    images: [
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1768387666438-b3da75373846?auto=format&fit=crop&w=900&q=85',
    ],
    tag: 'Pārbaudīta',
    description: 'Audi 2.0 TDI turbokompresors. Vārpsta pārbaudīta, bez liekas brīvkustības.',
  },
  {
    id: 'mercedes-w204-caliper',
    name: 'Mercedes-Benz W204 AMG bremžu suports',
    type: 'Lietota detaļa',
    price: 129,
    code: 'USED-MER-W204-00027',
    oem: '2044211381',
    manufacturer: 'Mercedes-Benz Original',
    brand: 'Mercedes-Benz',
    model: 'C klase W204 AMG',
    production_year: '2007–2014',
    engine: 'C63 AMG 6.2',
    category: 'Balstiekārta',
    condition: 'Ļoti labs',
    stock: 1,
    location: 'Plaukts D4 / 3. rinda',
    weight: '8 kg',
    dimensions: '32 × 24 × 22 cm',
    warranty: '3 mēneši',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85',
    images: [
      'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1759189901164-900e0afac895?auto=format&fit=crop&w=900&q=85',
    ],
    tag: 'Ļoti labs',
    description: 'AMG priekšējais bremžu suports. Notīrīts un pārbaudīts, gatavs uzstādīšanai.',
  },
  {
    id: 'bmw-e46-seat',
    name: 'BMW E46 sporta priekšējais sēdeklis',
    type: 'Lietota detaļa',
    price: 160,
    code: 'USED-BMW-E46-00914',
    oem: '52108239352',
    manufacturer: 'BMW Original',
    brand: 'BMW',
    model: '3. sērija E46',
    production_year: '1998–2006',
    engine: 'Visi benzīna',
    category: 'Salons',
    condition: 'Labs',
    stock: 1,
    location: 'Plaukts E1 / 2. rinda',
    weight: '19 kg',
    dimensions: '105 × 65 × 55 cm',
    warranty: '1 mēnesis',
    image: 'https://images.unsplash.com/photo-1652967786801-1b6ba8a00075?auto=format&fit=crop&w=900&q=85',
    images: [
      'https://images.unsplash.com/photo-1652967786801-1b6ba8a00075?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1760161339261-56487b766a17?auto=format&fit=crop&w=900&q=85',
    ],
    tag: 'Labs',
    description: 'Sporta sēdeklis ar tīru audumu un veseliem stiprinājumiem.',
  },
  {
    id: 'bmw-f10-control-module',
    name: 'BMW F10 komforta vadības bloks',
    type: 'Lietota detaļa',
    price: 85,
    code: 'USED-BMW-F10-00448',
    oem: '61359202765',
    manufacturer: 'BMW Original',
    brand: 'BMW',
    model: '5. sērija F10',
    production_year: '2010–2017',
    engine: 'Visi',
    category: 'Elektrība',
    condition: 'Pārbaudīts',
    stock: 1,
    location: 'Plaukts A1 / 5. rinda',
    weight: '0.6 kg',
    dimensions: '22 × 16 × 7 cm',
    warranty: '1 mēnesis',
    image: 'https://images.unsplash.com/photo-1569615313731-7407da4f4594?auto=format&fit=crop&w=900&q=85',
    images: [
      'https://images.unsplash.com/photo-1569615313731-7407da4f4594?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1765256931521-0f843b7b3100?auto=format&fit=crop&w=900&q=85',
    ],
    tag: 'Pārbaudīts',
    description: 'Komforta vadības modulis no strādājoša auto. Kods jāsalīdzina pirms pirkuma.',
  },
  {
    id: 'mercedes-w204-wheel',
    name: 'Mercedes-Benz AMG 18 collu disks',
    type: 'Lietota detaļa',
    price: 220,
    code: 'USED-MER-W204-00218',
    oem: '2044011602',
    manufacturer: 'AMG Original',
    brand: 'Mercedes-Benz',
    model: 'C klase W204',
    production_year: '2007–2014',
    engine: 'Visi',
    category: 'Riteņi un diski',
    condition: 'Ļoti labs',
    stock: 1,
    location: 'Plaukts F2 / 1. rinda',
    weight: '12 kg',
    dimensions: '58 × 58 × 25 cm',
    warranty: '1 mēnesis',
    image: 'https://images.unsplash.com/photo-1741366175071-3604c86ec475?auto=format&fit=crop&w=900&q=85',
    images: [
      'https://images.unsplash.com/photo-1741366175071-3604c86ec475?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1768341396286-a6322d588111?auto=format&fit=crop&w=900&q=85',
    ],
    tag: 'Ļoti labs',
    description: 'Oriģināls 18 collu AMG disks. Pārbaudīts uz balansiera, taisns.',
  },
]

export const FALLBACK_LISTINGS = [
  {
    id: 'demo-1',
    title: 'BMW E90 priekšējais bamperis M-pack',
    brand: 'BMW',
    model: 'E90',
    category: 'Virsbūve',
    condition: 'Ļoti labs',
    price: 180,
    location: 'Rīga',
    description: 'Taisns un gatavs uzstādīšanai. M-pack dizains, bez lieliem defektiem.',
    seller: 'Riga Performance Parts',
    phone: '+371 2000 0000',
    images: [
      'https://images.unsplash.com/photo-1750730011436-51c66f9a22b0?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1676104881946-917c6898726c?auto=format&fit=crop&w=900&q=85',
    ],
  },
  {
    id: 'demo-2',
    title: 'Audi A6 C7 3.0 TDI dzinējs',
    brand: 'Audi',
    model: 'A6 C7',
    category: 'Dzinējs',
    condition: 'Pārbaudīts',
    price: 950,
    location: 'Jelgava',
    description: 'Pilns dzinējs no ejoša auto. Var vienoties par apskati.',
    seller: 'Andris K.',
    phone: '+371 2555 1234',
    images: [
      'https://images.unsplash.com/photo-1627508795178-e852bd067a72?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1671719833602-1b4204a74f5e?auto=format&fit=crop&w=900&q=85',
    ],
  },
  {
    id: 'demo-3',
    title: 'VW Golf 7 GTI priekšējie sēdekļi',
    brand: 'Volkswagen',
    model: 'Golf 7',
    category: 'Salons',
    condition: 'Labs',
    price: 320,
    location: 'Rīga',
    description: 'GTI salona priekšējie sēdekļi labā stāvoklī.',
    seller: 'Mārtiņš',
    phone: '+371 2888 4567',
    images: [
      'https://images.unsplash.com/photo-1684324286366-d4b241077b11?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1677917367471-6b098b6bcc96?auto=format&fit=crop&w=900&q=85',
    ],
  },
]

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
  about: 'Par TrackParts',
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
  about: 'About TrackParts',
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

let products = FALLBACK_PRODUCTS.map((product) => ({ ...product }))
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
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data?.length) products = data
    productsLoaded = true
    return products
  } finally {
    productsLoaded = true
    resolveProductsReady?.(products)
  }
}
