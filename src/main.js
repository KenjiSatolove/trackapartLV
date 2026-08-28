import './style.css'
import { supabase } from './lib/supabase.js'

const SITE_URL = `${window.location.origin}${import.meta.env.BASE_URL}`

// Supabase's email-confirmation / password-recovery links redirect back here
// with tokens in the URL hash (e.g. #access_token=...&type=signup). Our own
// hash router also reads window.location.hash, so left alone it would try
// to treat that token blob as a page name. We only rewrite the hash once
// Supabase's client has told us it finished reading the tokens out of it
// (onAuthStateChange fires after that) — rewriting it any earlier risks
// wiping the tokens before Supabase itself gets to parse them.
let pendingAuthEvent = null
if (window.location.hash.includes('error=') || window.location.hash.includes('error_description=')) {
  window.location.hash = 'account'
}
if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      pendingAuthEvent = 'recovery'
      if (window.location.hash !== '#account') window.location.hash = 'account'; else renderPage()
    } else if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
      pendingAuthEvent = 'confirmed'
      if (window.location.hash !== '#account') window.location.hash = 'account'; else renderPage()
    }
  })
}

const FALLBACK_PRODUCTS = [
  { id: 'bmw-f10-left-light', name: 'BMW F10 priekšējais kreisais lukturis', type: 'Lietota detaļa', price: 249, code: 'USED-BMW-F10-00152', oem: '63117203298', manufacturer: 'BMW Original', brand: 'BMW', model: '5. sērija F10', production_year: '2010–2017', engine: '530d 3.0 D', category: 'Virsbūve', condition: 'Ļoti labs', stock: 1, location: 'Plaukts B3 / 2. rinda', weight: '4.2 kg', dimensions: '78 × 32 × 28 cm', warranty: '3 mēneši', image: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=85', tag: 'Ļoti labs', description: 'Oriģināls BMW F10 priekšējais kreisais lukturis. Pārbaudīts, stikls bez plaisām, stiprinājumi veseli.' },
  { id: 'bmw-e46-rear-axle', name: 'BMW E46 M3 aizmugurējais tilts', type: 'Lietota detaļa', price: 390, code: 'USED-BMW-E46-00881', oem: '33312282479', manufacturer: 'BMW Original', brand: 'BMW', model: '3. sērija E46 M3', production_year: '2000–2006', engine: 'S54 3.2', category: 'Balstiekārta', condition: 'Labs', stock: 1, location: 'Plaukts C1 / 1. rinda', weight: '38 kg', dimensions: '145 × 55 × 50 cm', warranty: '3 mēneši', image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85', tag: 'Pēdējais gabals', description: 'Pilns E46 M3 aizmugurējais tilts ar diferenciāli. Piemērots restaurācijai vai trases projektam.' },
  { id: 'audi-a4-turbo', name: 'Audi A4 B8 2.0 TDI turbīna', type: 'Lietota detaļa', price: 185, code: 'USED-AUD-B8-00304', oem: '03L145702J', manufacturer: 'Garrett', brand: 'Audi', model: 'A4 B8', production_year: '2008–2015', engine: '2.0 TDI 105 kW', category: 'Dzinējs', condition: 'Pārbaudīta', stock: 1, location: 'Plaukts A2 / 4. rinda', weight: '9.5 kg', dimensions: '35 × 32 × 30 cm', warranty: '1 mēnesis', image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85', tag: 'Pārbaudīta', description: 'Audi 2.0 TDI turbokompresors. Vārpsta pārbaudīta, bez liekas brīvkustības.' },
  { id: 'mercedes-w204-caliper', name: 'Mercedes-Benz W204 AMG bremžu suports', type: 'Lietota detaļa', price: 129, code: 'USED-MER-W204-00027', oem: '2044211381', manufacturer: 'Mercedes-Benz Original', brand: 'Mercedes-Benz', model: 'C klase W204 AMG', production_year: '2007–2014', engine: 'C63 AMG 6.2', category: 'Balstiekārta', condition: 'Ļoti labs', stock: 1, location: 'Plaukts D4 / 3. rinda', weight: '8 kg', dimensions: '32 × 24 × 22 cm', warranty: '3 mēneši', image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85', tag: 'Ļoti labs', description: 'AMG priekšējais bremžu suports. Notīrīts un pārbaudīts, gatavs uzstādīšanai.' },
  { id: 'bmw-e46-seat', name: 'BMW E46 sporta priekšējais sēdeklis', type: 'Lietota detaļa', price: 160, code: 'USED-BMW-E46-00914', oem: '52108239352', manufacturer: 'BMW Original', brand: 'BMW', model: '3. sērija E46', production_year: '1998–2006', engine: 'Visi benzīna', category: 'Salons', condition: 'Labs', stock: 1, location: 'Plaukts E1 / 2. rinda', weight: '19 kg', dimensions: '105 × 65 × 55 cm', warranty: '1 mēnesis', image: '', tag: 'Labs', description: 'Sporta sēdeklis ar tīru audumu un veseliem stiprinājumiem.' },
  { id: 'bmw-f10-control-module', name: 'BMW F10 komforta vadības bloks', type: 'Lietota detaļa', price: 85, code: 'USED-BMW-F10-00448', oem: '61359202765', manufacturer: 'BMW Original', brand: 'BMW', model: '5. sērija F10', production_year: '2010–2017', engine: 'Visi', category: 'Elektrība', condition: 'Pārbaudīts', stock: 1, location: 'Plaukts A1 / 5. rinda', weight: '0.6 kg', dimensions: '22 × 16 × 7 cm', warranty: '1 mēnesis', image: '', tag: 'Pārbaudīts', description: 'Komforta vadības modulis no strādājoša auto. Kods jāsalīdzina pirms pirkuma.' },
  { id: 'mercedes-w204-wheel', name: 'Mercedes-Benz AMG 18 collu disks', type: 'Lietota detaļa', price: 220, code: 'USED-MER-W204-00218', oem: '2044011602', manufacturer: 'AMG Original', brand: 'Mercedes-Benz', model: 'C klase W204', production_year: '2007–2014', engine: 'Visi', category: 'Riteņi un diski', condition: 'Ļoti labs', stock: 1, location: 'Plaukts F2 / 1. rinda', weight: '12 kg', dimensions: '58 × 58 × 25 cm', warranty: '1 mēnesis', image: '', tag: 'Ļoti labs', description: 'Oriģināls 18 collu AMG disks. Pārbaudīts uz balansiera, taisns.' },
]

let products = FALLBACK_PRODUCTS.map((product) => ({ ...product }))

// [number, display name, icon, canonical value used for product.category / URL slugs]
const CATEGORIES = [
  ['01', 'Dzinējs', '⚙', 'dzinējs'],
  ['02', 'Virsbūve', '◒', 'virsbūve'],
  ['03', 'Salons', '▣', 'salons'],
  ['04', 'Balstiekārta', '◈', 'balstiekārta'],
  ['05', 'Elektrība', 'ϟ', 'elektrība'],
  ['06', 'Riteņi & diski', '◉', 'riteņi un diski'],
]

async function loadProducts() {
  if (!supabase) return
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (data?.length) products = data
}

function slugify(text) {
  const stripped = (text || 'detala').toString().toLowerCase().trim().normalize('NFD')
  let plain = ''
  for (const char of stripped) { const code = char.codePointAt(0); if (code < 0x300 || code > 0x36f) plain += char }
  return plain.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'detala'
}

function stockLabel(stock) { return `${stock ?? 0} gab.` }

function productCardMarkup(product, index) {
  const dataName = [product.name, product.code, product.oem, product.brand, product.model, product.category, product.condition].filter(Boolean).join(' ').toLowerCase()
  return `<article class="product-card" data-product-id="${product.id}" data-name="${dataName}" data-price="${product.price}" data-category="${(product.category || '').toLowerCase()}" data-brand="${(product.brand || '').toLowerCase()}" data-model="${(product.model || '').toLowerCase()}" data-order="${index ?? 0}"><div class="product-image"><img src="${product.image || ''}" alt="${product.name}"/><span class="product-tag">${product.tag || product.condition || ''}</span><button class="quick-add" data-id="${product.id}" aria-label="Pievienot grozam">+</button></div><div class="product-meta"><span>${product.type}</span><small>${product.code || ''}</small></div><h3>${product.name}</h3><div class="product-bottom"><strong>${Number(product.price).toFixed(2).replace('.', ',')} €</strong><button class="add-text" data-id="${product.id}">PIEVIENOT <span>↗</span></button></div></article>`
}

function productGridMarkup(list) {
  return `<div class="product-grid" id="product-grid">${list.map((product, index) => productCardMarkup(product, index)).join('')}</div><p class="no-results" id="no-results" ${list.length ? 'hidden' : ''}>Neviena detaļa neatbilst meklējumam.</p>`
}

function searchBoxMarkup() {
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort()
  const models = [...new Set(products.map((p) => p.model).filter(Boolean))].sort()
  return `<form class="search-box" id="search-form"><span>⌕</span><input id="search-input" placeholder="Piem., BMW F10 lukturis vai 63117203298"/><button type="submit">MEKLĒT <b>↗</b></button></form><div class="select-row"><label>MARKA<select id="filter-brand"><option value="">Visas markas</option>${brands.map((b) => `<option value="${b.toLowerCase()}">${b}</option>`).join('')}</select></label><label>MODELIS<select id="filter-model"><option value="">Visi modeļi</option>${models.map((m) => `<option value="${m.toLowerCase()}">${m}</option>`).join('')}</select></label><label>DETAĻAS TIPS<select id="filter-category"><option value="">Visas kategorijas</option>${CATEGORIES.map((c) => `<option value="${c[3]}">${c[1]}</option>`).join('')}</select></label><label>KĀRTOT<select id="sort-select"><option value="">Jaunākie</option><option value="price-asc">Cena: no zemākās</option><option value="price-desc">Cena: no augstākās</option></select></label><button class="filter-button" id="more-filters" type="button">+ VAIRĀK FILTRU</button></div><div class="extra-filters" id="extra-filters"><label>STĀVOKLIS<select id="filter-condition"><option value="">Jebkurš</option><option value="ļoti labs">Ļoti labs</option><option value="labs">Labs</option><option value="pārbaudīt">Pārbaudīts</option><option value="ar defektu">Ar defektu</option></select></label><label>CENA NO (€)<input id="filter-price-min" type="number" min="0" placeholder="0"></label><label>CENA LĪDZ (€)<input id="filter-price-max" type="number" min="0" placeholder="1000"></label><label>GADS<input id="filter-year" placeholder="Piem., 2012"></label></div>`
}

function bindCatalogFilters() {
  const form = document.querySelector('#search-form')
  if (!form) return
  const brandSelect = document.querySelector('#filter-brand')
  const modelSelect = document.querySelector('#filter-model')
  const modelsByBrand = {}
  products.forEach((p) => { if (p.brand && p.model) { const key = p.brand.toLowerCase(); (modelsByBrand[key] ??= new Set()).add(p.model) } })
  const allModels = [...new Set(products.map((p) => p.model).filter(Boolean))].sort()
  const refreshModelOptions = () => {
    const brand = brandSelect?.value || ''
    const models = brand ? [...(modelsByBrand[brand] || [])].sort() : allModels
    const current = modelSelect.value
    modelSelect.innerHTML = `<option value="">Visi modeļi</option>${models.map((m) => `<option value="${m.toLowerCase()}">${m}</option>`).join('')}`
    if (models.some((m) => m.toLowerCase() === current)) modelSelect.value = current
  }
  const run = () => {
    const query = document.querySelector('#search-input').value.trim().toLowerCase()
    const brand = brandSelect?.value || ''
    const model = modelSelect?.value || ''
    const category = document.querySelector('#filter-category')?.value || ''
    const condition = document.querySelector('#filter-condition')?.value || ''
    const priceMin = Number(document.querySelector('#filter-price-min')?.value) || 0
    const priceMax = Number(document.querySelector('#filter-price-max')?.value) || Infinity
    const year = document.querySelector('#filter-year')?.value.trim().toLowerCase() || ''
    let visible = 0
    document.querySelectorAll('.product-card').forEach((card) => {
      const text = card.dataset.name
      const price = Number(card.dataset.price)
      const matches = (!query || text.includes(query)) && (!brand || card.dataset.brand === brand) && (!model || card.dataset.model === model) && (!category || card.dataset.category === category) && (!condition || text.includes(condition)) && price >= priceMin && price <= priceMax && (!year || text.includes(year))
      card.hidden = !matches
      if (matches) visible += 1
    })
    const noResults = document.querySelector('#no-results')
    if (noResults) noResults.hidden = visible !== 0
  }
  const sort = () => {
    const grid = document.querySelector('#product-grid')
    if (!grid) return
    const sortValue = document.querySelector('#sort-select')?.value || ''
    const cards = [...grid.querySelectorAll('.product-card')]
    cards.sort((a, b) => {
      if (sortValue === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price)
      if (sortValue === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price)
      return Number(a.dataset.order) - Number(b.dataset.order)
    })
    cards.forEach((card) => grid.appendChild(card))
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); run() })
  document.querySelectorAll('#filter-category, #filter-condition, #filter-price-min, #filter-price-max, #filter-year').forEach((el) => el.addEventListener('input', run))
  brandSelect?.addEventListener('change', () => { refreshModelOptions(); run() })
  modelSelect?.addEventListener('change', run)
  document.querySelector('#sort-select')?.addEventListener('change', sort)
  document.querySelector('#more-filters')?.addEventListener('click', (event) => { event.currentTarget.textContent = event.currentTarget.textContent.includes('VAIRĀK') ? '- MAZĀK FILTRU' : '+ VAIRĀK FILTRU'; document.querySelector('#extra-filters')?.classList.toggle('is-open') })
  document.querySelectorAll('[data-brand]').forEach((button) => button.addEventListener('click', () => { document.querySelector('#search-input').value = button.dataset.brand; run(); document.querySelector('#product-grid')?.scrollIntoView({ behavior: 'smooth' }) }))
}

function homeMarkup() {
  return `
    <section class="hero">
      <div class="hero-copy"><p class="eyebrow">DETĀĻAS, KURĀM VAR UZTICĒTIES</p><h1>Tava automašīna.<br><em>Mūsu detaļas.</em></h1><p class="hero-text">Pārbaudītas lietotas auto detaļas. Atrastas ātri, nosūtītas droši.</p><a class="button button-light" href="#catalog">SKATĪT KATALOGU <span>↗</span></a></div>
      <div class="hero-visual"><img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=90" alt="Autosporta auto trasē"><div class="hero-label">EST. 2024 <i></i> RĪGA, LV</div><div class="hero-spec">01 <span>TRACKPARTS</span></div></div>
      <div class="hero-stats"><div><strong>10k+</strong><span>DETAĻAS<br>NOLIKTAVĀ</span></div><div><strong>24h</strong><span>ĀTRA<br>IZSŪTĪŠANA</span></div><div><strong>EU</strong><span>PIEGĀDE<br>VISĀ EIROPĀ</span></div></div>
    </section>
    <div class="racing-stripe"></div>

    <section class="search-section reveal" id="catalog"><div class="section-kicker">01 / ATRODI SAVU DETAĻU</div><div class="search-heading"><h2>Ko tu meklē?</h2><p>Meklē pēc nosaukuma, OEM koda vai detaļas numura.</p></div>${searchBoxMarkup()}</section>

    <section class="brand-section reveal"><div class="section-kicker">MARKAS, KO PAZĪSTAM</div><div class="brand-strip">${['BMW', 'AUDI', 'MERCEDES-BENZ', 'VOLKSWAGEN', 'VOLVO', 'TOYOTA', 'FORD', 'HONDA'].map((brand) => `<button type="button" data-brand="${brand.toLowerCase()}">${brand}</button>`).join('')}</div></section>

    <section class="category-section reveal"><div class="section-top"><div><div class="section-kicker">02 / IZPĒTI KATEGORIJAS</div><h2>Viss, kas vajadzīgs<br><em>tavam auto.</em></h2></div><a class="text-link" href="#catalog">SKATĪT VISU <span>↗</span></a></div><div class="category-grid">${CATEGORIES.map(([n, name, icon, value]) => `<a class="category" href="#category-${value.replaceAll(' ', '-')}"><span class="category-number">${n}</span><span class="category-icon">${icon}</span><strong>${name}</strong><span class="arrow">↗</span></a>`).join('')}</div></section>

    <section class="product-section reveal" id="new"><div class="section-top"><div><div class="section-kicker">03 / JAUNUMI NOLIKTAVĀ</div><h2>Pēdējie <em>atradumi.</em></h2></div><a class="text-link" href="#listings">SKATĪT VISUS <span>↗</span></a></div>${productGridMarkup(products.slice(0, 8))}</section>

    <section class="listings-section reveal" id="listings"><div class="section-top"><div><div class="section-kicker">04 / KOPIENAS SLUDINĀJUMI</div><h2>Ko pārdod<br><em>citi.</em></h2></div><a class="text-link" href="#sell">PĀRDOT SAVU DETAĻU <span>↗</span></a></div><div class="listing-table" id="listing-table"><div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div><p class="listing-loading">Ielādējam sludinājumus...</p></div></section>

    <section class="trust-section reveal"><div><span class="trust-icon">✦</span><strong>Pārbaudīta kvalitāte</strong><p>Katra detaļa tiek apskatīta pirms nosūtīšanas.</p></div><div><span class="trust-icon">↝</span><strong>Piegāde Eiropā</strong><p>No mūsu noliktavas Rīgā līdz tavām durvīm.</p></div><div><span class="trust-icon">◷</span><strong>Atbalsts 7 dienas</strong><p>Zini, ko pērc. Mēs palīdzēsim atrast pareizo.</p></div></section>
  `
}

document.querySelector('#app').innerHTML = `
  <div class="page-wipe" id="page-wipe"></div>
  <div class="announcement">KVALITĀTES LIETOTAS DETAĻAS · PIEGĀDE VISĀ EIROPĀ <span>BEZMAKSA PIEGĀDE NO 150 €</span></div>
  <header class="site-header">
    <a class="brand" href="#home"><img src="${import.meta.env.BASE_URL}image-removebg-preview.png" alt="TrackParts LV logo"></a>
    <nav class="main-nav"><a class="active" href="#home">Sākums</a><a href="#catalog">Katalogs</a><a href="#listings">Sludinājumi</a><a href="#sell">Pārdot detaļu</a><a href="#account">Mans konts</a><a href="#contact">Kontakti</a></nav>
    <div class="header-actions"><button class="lang" type="button">LV <small>/ EN</small></button><button class="icon-button search-trigger" type="button" aria-label="Meklēt">⌕</button><button class="icon-button user-button" type="button" aria-label="Mans konts">◎</button><button class="cart-button" type="button" aria-label="Grozs">GROZS <b id="cart-count">0</b></button></div>
  </header>
  <aside class="cart-panel" id="cart-panel"><button class="cart-close" type="button" aria-label="Aizvērt grozu">×</button><div class="section-kicker">TAVS GROZS</div><h2>Atlasītās <em>detaļas.</em></h2><div id="cart-view"><div class="cart-items" id="cart-items"><p id="cart-empty">Grozs ir tukšs.</p></div><div class="cart-summary"><span>KOPĀ</span><strong id="cart-total">0,00 €</strong></div><button class="button button-dark" type="button" id="checkout-button">UZ NORĒĶINU ↗</button><button class="text-button" type="button" id="clear-cart">NOTĪRĪT GROZU</button></div><div id="checkout-view" hidden></div></aside>

  <div class="modal-overlay" id="auth-modal-overlay" hidden><div class="auth-modal"><button class="modal-close" id="auth-modal-close" type="button" aria-label="Aizvērt">×</button><div class="auth-modal-tabs"><button class="auth-tab active" data-auth-tab="login" type="button">IELOGOTIES</button><button class="auth-tab" data-auth-tab="signup" type="button">REĢISTRĒTIES</button></div><h2 class="auth-modal-title">Sveicināts <em>TrackParts.</em></h2><form class="site-form" id="auth-modal-form" data-mode="login"><label>E-PASTS<input type="email" name="email" required placeholder="tavs@epasts.lv"></label><label>PAROLE<input type="password" name="password" required minlength="6" placeholder="Vismaz 6 simboli"></label><label class="consent-label" id="auth-modal-consent-row" hidden><input type="checkbox" name="consent"> Piekrītu <a href="#terms">Lietošanas noteikumiem</a> un <a href="#privacy">Privātuma politikai</a>.</label><div class="form-actions"><button class="button button-dark" type="submit" id="auth-modal-submit">IELOGOTIES ↗</button><button class="text-button" id="auth-modal-forgot" type="button">AIZMIRSI PAROLI?</button></div><p class="form-message" id="auth-modal-message"></p></form></div></div>

  <div class="cookie-notice" id="cookie-notice" hidden><p>Šī vietne izmanto tikai tehniski nepieciešamu lokālo glabātuvi, lai uzturētu tavu pieslēgšanās sesiju. Uzzini vairāk mūsu <a href="#privacy">Privātuma politikā</a>.</p><button class="button button-light" type="button" id="cookie-notice-accept">SAPRATU</button></div>

  <div class="lightbox-overlay" id="lightbox-overlay" hidden><button class="lightbox-close" id="lightbox-close" type="button" aria-label="Aizvērt">×</button><img id="lightbox-image" src="" alt=""><button class="gallery-arrow gallery-prev" id="lightbox-prev" type="button" aria-label="Iepriekšējā bilde">‹</button><button class="gallery-arrow gallery-next" id="lightbox-next" type="button" aria-label="Nākamā bilde">›</button></div>

  <main></main>
  <footer id="contact"><div class="footer-brand"><a class="brand" href="#home"><img src="${import.meta.env.BASE_URL}image-removebg-preview.png" alt="TrackParts LV logo"></a><p>Auto detaļas bez liekām<br>rūpēm.</p></div><div class="footer-column"><b>VEIKALS</b><a href="#catalog">Jaunas detaļas</a><a href="#listings">Lietotas detaļas</a><a href="#catalog">Kategorijas</a></div><div class="footer-column"><b>PALĪDZĪBA</b><a href="#contact">Piegāde</a><a href="#contact">Atgriešana</a><a href="#contact">Kontakti</a><a href="#terms">Lietošanas noteikumi</a><a href="#privacy">Privātuma politika</a></div><div class="footer-contact"><b>RUNĀSIM</b><a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a><a href="tel:+37120000000">+371 2000 0000</a><p>Rīga, Latvija</p></div><div class="footer-bottom"><span>© 2024 TRACKPARTS</span><span>LV <small>/ EN</small></span><a href="https://www.instagram.com" target="_blank" rel="noreferrer">INSTAGRAM ↗</a></div></footer>
`

let cartCount = 0
const cartItems = []
const cartCountElement = document.querySelector('#cart-count')

function addToCart(product) {
  cartCount += 1
  cartItems.push(product)
  cartCountElement.textContent = cartCount
  renderCart()
}

function bindProductButtons() {
  document.querySelectorAll('.quick-add, .add-text').forEach((button) => button.addEventListener('click', () => {
    const product = products.find((item) => item.id === button.dataset.id)
    if (!product) return
    addToCart(product)
    button.textContent = '✓'
    setTimeout(() => { button.textContent = button.classList.contains('quick-add') ? '+' : 'PIEVIENOT ↗' }, 900)
  }))
  document.querySelectorAll('.product-card').forEach((card) => card.addEventListener('click', (event) => {
    if (event.target.closest('button')) return
    window.location.hash = `product-${card.dataset.productId}`
  }))
}

function renderCart() {
  const items = document.querySelector('#cart-items')
  const total = cartItems.reduce((sum, product) => sum + Number(product.price), 0)
  document.querySelector('#cart-total').textContent = `${total.toFixed(2).replace('.', ',')} €`
  items.innerHTML = cartItems.length ? cartItems.map((product) => `<div class="cart-item"><div><strong>${product.name}</strong><small>${product.code || ''}</small></div><b>${Number(product.price).toFixed(2).replace('.', ',')} €</b></div>`).join('') : '<p id="cart-empty">Grozs ir tukšs.</p>'
}

function checkoutFormMarkup() {
  const total = cartItems.reduce((sum, product) => sum + Number(product.price), 0)
  return `<div class="section-kicker">PASŪTĪJUMA PIEPRASĪJUMS</div><h2>Pabeidz <em>pasūtījumu.</em></h2><form id="checkout-form"><p class="form-message">Apmaksa tiešsaistē vēl nav pieejama — pēc pieprasījuma nosūtīšanas mēs sazināsimies pa e-pastu, lai vienotos par apmaksu un piegādi.</p><label>VĀRDS, UZVĀRDS<input name="name" required></label><label>E-PASTS<input name="email" type="email" required></label><label>TĀLRUNIS<input name="phone"></label><label>PIEGĀDES ADRESE<input name="address" required></label><label>PIEZĪMES<textarea name="notes" rows="3"></textarea></label><div class="form-actions"><button class="button button-light" type="submit"><span>NOSŪTĪT</span> (${total.toFixed(2).replace('.', ',')} €) ↗</button><button class="text-button" type="button" id="checkout-back">← ATPAKAĻ</button></div><p class="form-message" id="checkout-message"></p></form>`
}

document.querySelector('#checkout-button').addEventListener('click', () => {
  const cartView = document.querySelector('#cart-view')
  const checkoutView = document.querySelector('#checkout-view')
  if (!cartItems.length) { document.querySelector('#cart-items').insertAdjacentHTML('beforeend', '<p class="form-message">Pievieno detaļu grozam vispirms.</p>'); return }
  cartView.hidden = true
  checkoutView.hidden = false
  checkoutView.innerHTML = checkoutFormMarkup()
  document.querySelector('#checkout-back').addEventListener('click', () => { checkoutView.hidden = true; cartView.hidden = false })
  document.querySelector('#checkout-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector('#checkout-message')
    if (!supabase) { message.textContent = 'Pasūtījumu sistēma nav pieejama.'; return }
    const data = new FormData(event.target)
    const total = cartItems.reduce((sum, product) => sum + Number(product.price), 0)
    const { data: order, error } = await supabase.from('orders').insert({ buyer_name: data.get('name'), buyer_email: data.get('email'), buyer_phone: data.get('phone'), buyer_address: data.get('address'), notes: data.get('notes'), total }).select().single()
    if (error) { message.textContent = error.message; return }
    await supabase.from('order_items').insert(cartItems.map((product) => ({ order_id: order.id, product_id: product.id, product_name: product.name, price: product.price, quantity: 1 })))
    checkoutView.innerHTML = `<div class="section-kicker">PALDIES!</div><h2>Pasūtījums <em>saņemts.</em></h2><p class="form-message">Pasūtījums #${order.id} saņemts. Mēs sazināsimies pa e-pastu ${data.get('email')}, lai vienotos par apmaksu un piegādi.</p><button class="text-button" type="button" id="checkout-close">AIZVĒRT</button>`
    document.querySelector('#checkout-close').addEventListener('click', () => { checkoutView.hidden = true; cartView.hidden = false; document.querySelector('#cart-panel').classList.remove('is-open') })
    cartItems.length = 0
    cartCount = 0
    cartCountElement.textContent = '0'
    renderCart()
  })
})

document.querySelector('.search-trigger').addEventListener('click', () => { window.location.hash = 'home'; setTimeout(() => document.querySelector('#search-input')?.focus(), 50) })
document.querySelector('.user-button').addEventListener('click', async () => {
  if (!supabase) { window.location.hash = 'account'; return }
  const { data: { user } } = await supabase.auth.getUser()
  if (user) { window.location.hash = 'account' } else { openAuthModal('login') }
})
document.querySelector('.cart-button').addEventListener('click', () => document.querySelector('#cart-panel').classList.toggle('is-open'))
document.querySelector('.cart-close').addEventListener('click', () => document.querySelector('#cart-panel').classList.remove('is-open'))

try {
  if (!localStorage.getItem('cookieNoticeDismissed')) document.querySelector('#cookie-notice').hidden = false
} catch { /* localStorage unavailable (private browsing) — skip the notice */ }
document.querySelector('#cookie-notice-accept').addEventListener('click', () => {
  document.querySelector('#cookie-notice').hidden = true
  try { localStorage.setItem('cookieNoticeDismissed', '1') } catch { /* ignore */ }
})

function openAuthModal(mode) {
  const overlay = document.querySelector('#auth-modal-overlay')
  if (!overlay) return
  overlay.hidden = false
  setAuthModalTab(mode || 'login')
  setTimeout(() => document.querySelector('#auth-modal-overlay input[name="email"]')?.focus(), 50)
}

function closeAuthModal() {
  const overlay = document.querySelector('#auth-modal-overlay')
  if (overlay) overlay.hidden = true
  const message = document.querySelector('#auth-modal-message')
  if (message) message.textContent = ''
  document.querySelector('#auth-modal-form')?.reset()
}

function setAuthModalTab(mode) {
  document.querySelectorAll('.auth-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.authTab === mode))
  document.querySelector('#auth-modal-submit').textContent = mode === 'signup' ? 'IZVEIDOT KONTU ↗' : 'IELOGOTIES ↗'
  document.querySelector('#auth-modal-form').dataset.mode = mode
  document.querySelector('#auth-modal-message').textContent = ''
  const consentRow = document.querySelector('#auth-modal-consent-row')
  consentRow.hidden = mode !== 'signup'
  consentRow.querySelector('input').required = mode === 'signup'
  if (mode !== 'signup') consentRow.querySelector('input').checked = false
}

if (supabase) {
  document.querySelector('#auth-modal-close').addEventListener('click', closeAuthModal)
  document.querySelector('#auth-modal-overlay').addEventListener('click', (event) => { if (event.target.id === 'auth-modal-overlay') closeAuthModal() })
  document.querySelectorAll('.auth-tab').forEach((tab) => tab.addEventListener('click', () => setAuthModalTab(tab.dataset.authTab)))
  document.querySelector('#auth-modal-forgot').addEventListener('click', async () => {
    const email = new FormData(document.querySelector('#auth-modal-form')).get('email')
    const message = document.querySelector('#auth-modal-message')
    if (!email) { message.textContent = 'Ievadi e-pastu, lai atjaunotu paroli.'; return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}#account` })
    message.textContent = error ? error.message : 'Paroles atjaunošanas saite nosūtīta uz e-pastu.'
  })
  document.querySelector('#auth-modal-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.target
    const data = new FormData(form)
    const message = document.querySelector('#auth-modal-message')
    if (!data.get('email') || !data.get('password')) { message.textContent = 'Ievadi e-pastu un paroli.'; return }
    if (form.dataset.mode === 'signup') {
      if (!data.get('consent')) { message.textContent = 'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.'; return }
      const { error } = await supabase.auth.signUp({ email: data.get('email'), password: data.get('password'), options: { emailRedirectTo: `${SITE_URL}#account` } })
      message.textContent = error ? error.message : 'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.'
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') })
      if (error) { message.textContent = error.message; return }
      closeAuthModal()
      window.location.hash = 'account'
      renderPage()
    }
  })
}
document.querySelector('#clear-cart').addEventListener('click', () => { cartItems.length = 0; cartCount = 0; cartCountElement.textContent = '0'; renderCart() })

function renderPage() {
  const route = window.location.hash.slice(1) || 'home'
  const pages = {
    catalog: `<section class="page-hero"><div class="section-kicker">02 / PREČU KATALOGS</div><h1>Atrodi detaļu.<br><em>Uztaisi ātrāku.</em></h1><p>Oriģinālas un pārbaudītas detaļas ielas auto, trases projektam un servisam.</p></section><section class="search-section reveal"><div class="section-kicker">FILTRĒ KATALOGU</div>${searchBoxMarkup()}</section><section class="product-section catalog-page reveal"><div class="section-top"><div><div class="section-kicker">VISAS DETAĻAS</div><h2>Noliktavā <em>tagad.</em></h2></div><span class="catalog-count">${products.length} <span>PRECES</span></span></div>${productGridMarkup(products)}</section>`,
    about: `<section class="page-hero about-hero"><div class="section-kicker">03 / PAR TRACKPARTS</div><h1>Built for the<br><em>road ahead.</em></h1><p>Mēs atrodam labas detaļas cilvēkiem, kuri paši zina, cik svarīgs ir katrs pagrieziens.</p></section><section class="story-section reveal"><div class="section-kicker">MŪSU PIEEJA</div><h2>Nevis detaļu kaudze.<br><em>Īstais atradums.</em></h2><div class="story-grid"><p>TrackParts sākās Rīgā ar vienu vienkāršu ideju: lietotai detaļai nav jābūt kompromisam. Katra detaļa tiek pārbaudīta, nofotografēta un marķēta, lai tu vari pirkt ar pārliecību.</p><p>Mūsu noliktavā katram kodam ir sava vieta, statuss un vēsture. Mazāk minēšanas, vairāk laika uz ceļa.</p></div></section><section class="trust-section reveal"><div><span class="trust-icon">✦</span><strong>Pārbaudīta kvalitāte</strong><p>Katrs produkts tiek apskatīts pirms pārdošanas.</p></div><div><span class="trust-icon">↝</span><strong>Piegāde Eiropā</strong><p>No Rīgas līdz tavām durvīm.</p></div><div><span class="trust-icon">◷</span><strong>Cilvēcīgs atbalsts</strong><p>Palīdzēsim atrast pareizo detaļu.</p></div></section>`,
    contact: `<section class="page-hero contact-hero"><div class="section-kicker">04 / SAZINĀSIMIES</div><h1>Ir jautājums?<br><em>Dod ziņu.</em></h1><p>Neatrodi detaļu katalogā? Atsūti VIN, OEM kodu vai bildi, un mēs paskatīsimies.</p></section><section class="contact-section reveal"><div><div class="section-kicker">RAKSTI MUMS</div><h2>Atbildēsim<br><em>ātri.</em></h2></div><div class="contact-list"><a href="mailto:hello@trackparts.lv"><small>E-PASTS</small>hello@trackparts.lv ↗</a><a href="tel:+37120000000"><small>TELEFONS</small>+371 2000 0000 ↗</a><div><small>ATRODI MŪS</small>Rīga, Latvija</div></div></section>`,
    terms: `<section class="page-hero"><div class="section-kicker">LIETOŠANAS NOTEIKUMI</div><h1>Noteikumi.<br><em>Skaidri un godīgi.</em></h1><p>Šie noteikumi regulē TrackParts interneta veikala un sludinājumu platformas lietošanu.</p></section><section class="legal-page">
      <small class="legal-updated">Pēdējo reizi atjaunots: 2026. gada augustā</small>
      <p class="legal-lang-note">Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.</p>
      <h3>1. Vispārīga informācija</h3>
      <p>Šo tīmekļa vietni ("TrackParts", "mēs") uztur [UZŅĒMUMA NOSAUKUMS / KOMERSANTA VĀRDS, REĢ. NR. XXXXXXXXXXX, JURIDISKĀ ADRESE], turpmāk — "Pārdevējs" vai "Operators". Lietojot vietni, tu piekrīti šiem noteikumiem. Ja nepiekrīti, lūdzu, nelieto vietni.</p>
      <h3>2. Konta reģistrācija</h3>
      <p>Reģistrējoties tu apliecini, ka sniegtā informācija ir patiesa un ka tev ir vismaz 18 gadu, vai arī rīkojies ar likumiskā pārstāvja piekrišanu. Tu esi atbildīgs par sava konta datu konfidencialitāti un visām darbībām, kas veiktas, izmantojot tavu kontu.</p>
      <h3>3. Pasūtījumi un cenas</h3>
      <p>Cenas norādītas eiro (€) un, ja piemērojams, ietver PVN. Interneta apmaksa pašlaik nav pieejama — pēc pasūtījuma pieprasījuma nosūtīšanas mēs sazināmies ar tevi pa e-pastu, lai vienotos par apmaksu un piegādi. Līgums starp pusēm uzskatāms par noslēgtu tikai pēc abpusējas apmaksas un piegādes nosacījumu apstiprināšanas.</p>
      <h3>4. Atteikuma tiesības (14 dienas)</h3>
      <p>Ja esi patērētājs (fiziska persona, kas pērk ārpus savas saimnieciskās darbības), tev ir tiesības atteikties no pirkuma 14 kalendāro dienu laikā no preces saņemšanas dienas, nenorādot iemeslu, saskaņā ar Patērētāju tiesību aizsardzības likumu un ES Direktīvu 2011/83/ES. Lai izmantotu šīs tiesības, raksti mums uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>. Nauda tiek atmaksāta 14 dienu laikā pēc preces saņemšanas atpakaļ. Preces atpakaļsūtīšanas izmaksas sedz pircējs, ja vien nav norādīts citādi. Prece jāatdod tādā stāvoklī, kāds nepieciešams tās īpašību un darbības pārbaudei.</p>
      <h3>5. Kopienas sludinājumi</h3>
      <p>Reģistrēti lietotāji var publicēt savus sludinājumus. Par sludinājuma saturu, precizitāti un preces stāvokli atbild attiecīgais lietotājs — TrackParts darbojas kā starpnieks (informācijas sabiedrības pakalpojumu sniedzējs) un neveic katras detaļas fizisku pārbaudi pirms publicēšanas. Aizliegts publicēt maldinošu, nelikumīgu vai trešo personu tiesības aizskarošu saturu. Mēs paturam tiesības noņemt sludinājumus, kas pārkāpj šos noteikumus.</p>
      <h3>6. Atbildības ierobežojums</h3>
      <p>Mēs nenesam atbildību par netiešiem zaudējumiem, kas radušies vietnes lietošanas rezultātā, izņemot gadījumos, kad atbildību nevar ierobežot saskaņā ar piemērojamiem tiesību aktiem (piemēram, par miesas bojājumiem vai krāpšanu).</p>
      <h3>7. Strīdu risināšana</h3>
      <p>Šiem noteikumiem piemērojami Latvijas Republikas tiesību akti. Ja rodas strīds, vispirms sazinies ar mums tieši. Patērētāji var vērsties arī Patērētāju tiesību aizsardzības centrā (<a href="https://www.ptac.gov.lv" target="_blank" rel="noreferrer">ptac.gov.lv</a>) vai izmantot ES Strīdu izšķiršanas tiešsaistes platformu (<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">ec.europa.eu/consumers/odr</a>).</p>
      <h3>8. Grozījumi</h3>
      <p>Mēs varam šos noteikumus laiku pa laikam atjaunot. Būtiskas izmaiņas tiks paziņotas vietnē. Turpinot lietot vietni pēc izmaiņām, tu piekrīti atjauninātajiem noteikumiem.</p>
      <h3>9. Kontakti</h3>
      <p>Jautājumu gadījumā raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a> vai zvani +371 2000 0000.</p>
    </section>`,
    privacy: `<section class="page-hero"><div class="section-kicker">PRIVĀTUMA POLITIKA</div><h1>Tavi dati.<br><em>Mūsu atbildība.</em></h1><p>Šī politika izskaidro, kādus personas datus TrackParts apstrādā un kāpēc, saskaņā ar Vispārīgo datu aizsardzības regulu (VDAR/GDPR).</p></section><section class="legal-page">
      <small class="legal-updated">Pēdējo reizi atjaunots: 2026. gada augustā</small>
      <p class="legal-lang-note">Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.</p>
      <h3>1. Pārzinis</h3>
      <p>Par tavu personas datu apstrādi atbild [UZŅĒMUMA NOSAUKUMS / KOMERSANTA VĀRDS, REĢ. NR. XXXXXXXXXXX, JURIDISKĀ ADRESE]. Jautājumos par datu apstrādi raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>.</p>
      <h3>2. Kādus datus mēs apstrādājam</h3>
      <ul>
        <li>Konta dati: e-pasts, parole (šifrētā veidā), lietotājvārds, vārds, tālrunis, pilsēta.</li>
        <li>Sludinājumu dati: viss, ko norādi, publicējot sludinājumu (nosaukums, cena, apraksts, fotogrāfijas, atrašanās vieta).</li>
        <li>Pasūtījumu dati: vārds, e-pasts, tālrunis, piegādes adrese, piezīmes.</li>
        <li>Tehniskie dati: pieslēgšanās sesijas informācija, ko pārlūkprogramma glabā lokāli, lai tu paliktu ielogojies.</li>
      </ul>
      <h3>3. Apstrādes nolūki un tiesiskais pamats</h3>
      <p>Datus apstrādājam, lai izpildītu ar tevi noslēgto līgumu (konta izveide, pasūtījumu un sludinājumu apstrāde) — VDAR 6. panta 1. daļas (b) punkts, kā arī lai nodrošinātu vietnes drošību un novērstu ļaunprātīgu izmantošanu — leģitīmās intereses, VDAR 6. panta 1. daļas (f) punkts. Mēs nesūtām mārketinga e-pastus un neizmantojam tavus datus reklāmas mērķiem.</p>
      <h3>4. Datu glabāšanas termiņš</h3>
      <p>Datus glabājam, kamēr tavs konts ir aktīvs. Ja pieprasi konta dzēšanu, tavus personas datus dzēšam vai anonimizējam saprātīgā termiņā, izņemot datus, kurus mums jāglabā ilgāk saskaņā ar likumu (piemēram, grāmatvedības dokumentus).</p>
      <h3>5. Datu saņēmēji</h3>
      <p>Tavus datus glabā un apstrādā Supabase (datubāzes, autentifikācijas un faila glabāšanas pakalpojumu sniedzējs) kā mūsu datu apstrādātājs. Datus nepārdodam un nekopīgojam ar trešajām personām reklāmas nolūkos.</p>
      <h3>6. Tavas tiesības</h3>
      <p>Tev ir tiesības pieprasīt piekļuvi saviem datiem, to labošanu, dzēšanu, apstrādes ierobežošanu, iebilst pret apstrādi un saņemt datus pārnesamā formātā. Lai izmantotu šīs tiesības, raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>. Ja uzskati, ka tavas tiesības ir pārkāptas, vari iesniegt sūdzību Datu valsts inspekcijā (<a href="https://www.dvi.gov.lv" target="_blank" rel="noreferrer">dvi.gov.lv</a>).</p>
      <h3>7. Sīkdatnes un lokālā glabātuve</h3>
      <p>Vietne izmanto tikai tehniski nepieciešamu pārlūkprogrammas lokālo glabātuvi (local storage), lai uzturētu tavu pieslēgšanās sesiju. Mēs neizmantojam analītikas vai reklāmas sīkdatnes.</p>
      <h3>8. Kontakti</h3>
      <p>Jautājumu vai lūgumu gadījumā par saviem datiem raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>.</p>
    </section>`,
    account: `<section class="page-hero"><div class="section-kicker">05 / TAVS KONTS</div><h1>Pieslēdzies.<br><em>Pārdod.</em></h1><p>Izveido kontu, lai ievietotu detaļas un pārvaldītu savus sludinājumus.</p></section><section class="form-section"><div id="account-content"><form class="site-form" id="auth-form"><div class="section-kicker">LIETOTĀJA PIEKĻUVE</div><h2>Ienākt vai <em>reģistrēties.</em></h2><label>E-PASTS<input type="email" name="email" required placeholder="tavs@epasts.lv"></label><label>PAROLE<input type="password" name="password" required minlength="6" placeholder="Vismaz 6 simboli"></label><label class="consent-label"><input type="checkbox" name="consent"> Piekrītu <a href="#terms">Lietošanas noteikumiem</a> un <a href="#privacy">Privātuma politikai</a> (nepieciešams, veidojot jaunu kontu).</label><div class="form-actions"><button class="button button-dark" type="submit">IELOGOTIES ↗</button><button class="text-button" id="signup-button" type="button">IZVEIDOT KONTU</button><button class="text-button" id="forgot-password" type="button">AIZMIRSI PAROLI?</button></div><p class="form-message" id="auth-message"></p></form></div></section>`,
    sell: `<section class="page-hero"><div class="section-kicker">06 / JAUNS SLUDINĀJUMS</div><h1>Ieliec detaļu<br><em>uz ceļa.</em></h1><p>Aizpildi informāciju, pievieno bildes un sasniedz cilvēku, kuram tā vajadzīga.</p></section><section class="form-section"><form class="site-form listing-form" id="listing-form"><div class="section-kicker">DETAĻAS INFORMĀCIJA</div><h2>Ko tu <em>pārdod?</em></h2><label>NOSAUKUMS<input name="title" required placeholder="Piem., BMW E46 priekšējais lukturis"></label><div class="form-two"><label>CENA (€)<input name="price" type="number" min="0" step="0.01" required placeholder="250"></label><label>OEM NUMURS<input name="oem_number" placeholder="63117203298"></label></div><div class="form-two"><label>MARKA<input name="brand" placeholder="BMW"></label><label>MODELIS<input name="model" placeholder="E46"></label></div><div class="form-two"><label>GADS<input name="production_year" type="number" min="1950" max="2030" placeholder="2014"></label><label>DZINĒJS<input name="engine" placeholder="530d / 3.0 TDI"></label></div><div class="form-two"><label>KATEGORIJA<select name="category">${CATEGORIES.map((c) => `<option>${c[1] === 'Riteņi & diski' ? 'Riteņi un diski' : c[1]}</option>`).join('')}</select></label><label>ATRAŠANĀS VIETA<input name="location" placeholder="Rīga, noliktava B3"></label></div><label>STĀVOKLIS<select name="condition"><option value="very_good">Ļoti labs</option><option value="good">Labs</option><option value="defect">Ar defektu</option></select></label><label>APRAKSTS<textarea name="description" rows="5" placeholder="Apraksti detaļas stāvokli un zināmos defektus"></textarea></label><label>BILDES<input name="images" type="file" accept="image/*" multiple required></label><div class="form-actions"><button class="button button-dark" type="submit">PUBLICĒT SLUDINĀJUMU ↗</button></div><p class="form-message" id="listing-message"></p></form></section>`,
  }
  document.querySelector('main').innerHTML = route === 'home' ? homeMarkup() : (route === 'admin' ? adminPage : (route === 'listings' ? listingsPage : (route.startsWith('listing-') ? listingDetailPage : (route.startsWith('product-') ? productDetailPage : (route.startsWith('category-') ? categoryPage(route.replace('category-', '').replaceAll('-', ' ')) : (pages[route] || pages.catalog))))))
  document.querySelectorAll('.main-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${route}`))
  bindProductButtons()
  bindRouteForms(route)
  bindCatalogFilters()
  loadListings()
  if (route.startsWith('category-')) loadCategoryListings(route.replace('category-', '').replaceAll('-', ' '))
  if (route.startsWith('listing-')) loadListingDetail(route.replace('listing-', ''))
  if (route.startsWith('product-')) loadProductDetail(route.replace('product-', ''))
  if (route === 'admin') bindAdminPage()
  if (route === 'account') initAccountPage()
  if (english) translatePage()
  initScrollReveal()
}

function animateCountUp(el) {
  const match = el.textContent.trim().match(/^(\d+)(.*)$/)
  if (!match) return
  const target = Number(match[1])
  const suffix = match[2]
  const duration = 1100
  const start = performance.now()
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = `${Math.round(target * eased)}${suffix}`
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) { document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')); return }
  const sectionObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      obs.unobserve(entry.target)
    })
  }, { threshold: 0.15 })
  document.querySelectorAll('main .reveal').forEach((el) => sectionObserver.observe(el))
  const statObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      animateCountUp(entry.target)
      obs.unobserve(entry.target)
    })
  }, { threshold: 0.6 })
  document.querySelectorAll('.hero-stats strong').forEach((el) => statObserver.observe(el))
}

const fallbackListings = [
  { id: 'demo-1', title: 'BMW E90 priekšējais bamperis M-pack', brand: 'BMW', model: 'E90', category: 'Virsbūve', condition: 'Ļoti labs', price: 180, location: 'Rīga', description: 'Taisns un gatavs uzstādīšanai. M-pack dizains, bez lieliem defektiem.', seller: 'Riga Performance Parts', phone: '+371 2000 0000' },
  { id: 'demo-2', title: 'Audi A6 C7 3.0 TDI dzinējs', brand: 'Audi', model: 'A6 C7', category: 'Dzinējs', condition: 'Pārbaudīts', price: 950, location: 'Jelgava', description: 'Pilns dzinējs no ejoša auto. Var vienoties par apskati.', seller: 'Andris K.', phone: '+371 2555 1234' },
  { id: 'demo-3', title: 'VW Golf 7 GTI priekšējie sēdekļi', brand: 'Volkswagen', model: 'Golf 7', category: 'Salons', condition: 'Labs', price: 320, location: 'Rīga', description: 'GTI salona priekšējie sēdekļi labā stāvoklī.', seller: 'Mārtiņš', phone: '+371 2888 4567' },
]

const listingsPage = `<section class="page-hero"><div class="section-kicker">04 / KOPIENAS TIRGUS</div><h1>Redzi, ko citi<br><em>pārdod.</em></h1><p>Īstas detaļas no TrackParts kopienas. Atver sludinājumu, lai redzētu pārdevēju un sazinātos.</p></section><section class="listings-section listings-page"><div class="section-top"><div><div class="section-kicker">AKTĪVIE SLUDINĀJUMI</div><h2>Jaunākie <em>sludinājumi.</em></h2></div><a class="button button-dark" href="#sell">PĀRDOT DETAĻU ↗</a></div><div class="listing-table" id="listing-table"><div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div><p class="listing-loading">Ielādējam sludinājumus...</p></div></section>`
const listingDetailPage = `<section class="detail-page"><a class="back-link" href="#listings">← ATPAKAĻ UZ SLUDINĀJUMIEM</a><div class="detail-layout"><div><div id="detail-gallery"></div><div class="section-kicker">SLUDINĀJUMA INFORMĀCIJA</div><h1 id="detail-title">Ielādē...</h1><p id="detail-description" class="detail-description"></p></div><aside class="seller-panel"><span class="product-tag">AKTĪVS SLUDINĀJUMS</span><strong id="detail-price"></strong><div class="detail-data" id="detail-data"></div><hr><small>PĀRDEVĒJS</small><h3 id="detail-seller"></h3><a id="detail-phone" class="seller-contact" href="mailto:hello@trackparts.lv">SAZINĀTIES ↗</a><a class="seller-contact" href="mailto:hello@trackparts.lv">RAKSTĪT E-PASTU ↗</a></aside></div></section>`
const adminPage = `<section class="admin-shell"><div class="admin-login" id="admin-login"><div class="admin-mark">TP / ADMIN</div><div class="section-kicker">PRIVĀTA PIEKĻUVE</div><h1>Vadības<br><em>panelis.</em></h1><p>Ielogojies ar īpašnieka kontu, lai pārvaldītu TrackParts.</p><form class="site-form" id="admin-auth-form"><label>E-PASTS<input name="email" type="email" required placeholder="owner@trackparts.lv"></label><label>PAROLE<input name="password" type="password" required></label><button class="button button-dark" type="submit">IEIET PANELĪ ↗</button><p class="form-message" id="admin-auth-message"></p></form></div><div id="admin-dashboard" hidden></div></section>`

function bindAdminPage() {
  if (!supabase) return
  const form = document.querySelector('#admin-auth-form')
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const message = document.querySelector('#admin-auth-message')
    const { error } = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') })
    if (error) { message.textContent = error.message; return }
    await loadAdminDashboard()
  })
  supabase.auth.getSession().then(({ data }) => { if (data.session) loadAdminDashboard() })
}

async function loadAdminDashboard() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('display_name, username, role').eq('id', user.id).single()
  const allowedRoles = ['owner', 'manager', 'warehouse', 'fulfillment']
  if (!profile || !allowedRoles.includes(profile.role)) { document.querySelector('#admin-auth-message').textContent = profile ? 'Šim kontam nav admin piekļuves.' : 'Profils nav atrasts. Palaid migration_products_and_signup.sql Supabase SQL Editor un mēģini vēlreiz.'; await supabase.auth.signOut(); return }
  document.querySelector('#admin-login').hidden = true
  const dashboard = document.querySelector('#admin-dashboard')
  dashboard.hidden = false
  dashboard.innerHTML = `<div class="admin-layout"><aside class="admin-sidebar"><div class="admin-logo">◉ <strong>Admin</strong><small>${profile.username || profile.display_name || 'Owner'}</small></div><button class="admin-tab active" data-tab="dashboard">▦ Dashboard</button><button class="admin-tab" data-tab="products">▣ Products</button><button class="admin-tab" data-tab="orders">≡ Orders</button><button class="admin-tab" data-tab="listings">♧ Community listings <b id="pending-badge">0</b></button><button class="admin-tab" data-tab="tasks">✓ Team tasks</button><button class="admin-tab" data-tab="settings">⚙ Settings</button><button class="admin-logout" id="admin-logout">Iziet</button></aside><section class="admin-content" id="admin-content"></section></div>`
  document.querySelectorAll('.admin-tab').forEach((tab) => tab.addEventListener('click', () => { document.querySelectorAll('.admin-tab').forEach((item) => item.classList.remove('active')); tab.classList.add('active'); renderAdminTab(tab.dataset.tab) }))
  document.querySelector('#admin-logout').addEventListener('click', async () => { await supabase.auth.signOut(); window.location.hash = 'home' })
  renderAdminTab('dashboard')
}

function adminProductFormMarkup(product) {
  const p = product || {}
  return `<form class="admin-product-form" id="admin-product-form"><h3>${product ? 'Edit product' : 'Add product'}</h3><input type="hidden" name="id" value="${p.id || ''}"><label>NAME<input name="name" required value="${p.name || ''}"></label><div class="form-two"><label>CATEGORY<select name="category">${CATEGORIES.map((c) => `<option value="${c[1] === 'Riteņi & diski' ? 'Riteņi un diski' : c[1]}" ${p.category === c[1] || (c[1] === 'Riteņi & diski' && p.category === 'Riteņi un diski') ? 'selected' : ''}>${c[1]}</option>`).join('')}</select></label><label>CONDITION<input name="condition" value="${p.condition || 'Labs'}"></label></div><div class="form-two"><label>PRICE (€)<input name="price" type="number" min="0" step="0.01" required value="${p.price ?? ''}"></label><label>STOCK QTY<input name="stock" type="number" min="0" value="${p.stock ?? 1}"></label></div><div class="form-two"><label>BRAND<input name="brand" value="${p.brand || ''}"></label><label>MODEL<input name="model" value="${p.model || ''}"></label></div><div class="form-two"><label>OEM NUMBER<input name="oem" value="${p.oem || ''}"></label><label>PART CODE<input name="code" value="${p.code || ''}"></label></div><div class="form-two"><label>YEAR RANGE<input name="production_year" value="${p.production_year || ''}"></label><label>ENGINE<input name="engine" value="${p.engine || ''}"></label></div><label>LOCATION<input name="location" value="${p.location || ''}"></label><label>IMAGE URLS (one per line)<textarea name="images" rows="3">${(p.images?.length ? p.images : [p.image].filter(Boolean)).join('\n')}</textarea></label><label>DESCRIPTION<textarea name="description" rows="3">${p.description || ''}</textarea></label><div class="form-actions"><button class="button button-dark" type="submit">${product ? 'Save changes' : 'Add product'}</button><button class="text-button" type="button" id="admin-product-cancel">Cancel</button></div><p class="admin-note" id="admin-product-form-message"></p></form>`
}

function bindAdminProductForm(existingProduct) {
  const holder = document.querySelector('#admin-product-form-holder')
  if (!holder) return
  holder.innerHTML = adminProductFormMarkup(existingProduct)
  document.querySelector('#admin-product-cancel').addEventListener('click', () => { holder.innerHTML = '' })
  document.querySelector('#admin-product-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector('#admin-product-form-message')
    const data = new FormData(event.target)
    const id = data.get('id') || `${slugify(data.get('name'))}-${Math.random().toString(36).slice(2, 7)}`
    const images = (data.get('images') || '').split('\n').map((line) => line.trim()).filter(Boolean)
    const row = { id, name: data.get('name'), category: data.get('category'), condition: data.get('condition'), price: Number(data.get('price')), stock: Number(data.get('stock')) || 0, brand: data.get('brand'), model: data.get('model'), oem: data.get('oem'), code: data.get('code'), production_year: data.get('production_year'), engine: data.get('engine'), location: data.get('location'), image: images[0] || '', images, description: data.get('description'), type: 'Lietota detaļa', tag: data.get('condition') }
    const { error } = await supabase.from('products').upsert(row)
    if (error) { message.textContent = error.message; return }
    await loadProducts()
    renderAdminTab('products')
  })
}

async function renderAdminTab(tab) {
  const content = document.querySelector('#admin-content')
  if (!content) return
  const { count: listingCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).neq('status', 'removed')
  document.querySelector('#pending-badge').textContent = listingCount || 0
  if (tab === 'dashboard') content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">OVERVIEW</span><h2>Inventory overview</h2></div><span class="admin-user">Owner / ${new Date().toLocaleDateString('lv-LV')}</span></div><div class="admin-metrics"><div><span>Products in stock</span><strong>${products.length}</strong></div><div><span>Low stock</span><strong class="warning">${products.filter((p) => Number(p.stock) <= 2).length}</strong></div><div><span>Community listings</span><strong>${listingCount || 0}</strong></div></div><div class="admin-table"><div class="admin-table-head"><span>Part</span><span>Category</span><span>Stock</span><span>Price</span></div>${products.slice(0, 4).map((product) => `<div class="admin-table-row"><strong>${product.name}</strong><span>${product.category}</span><span>${stockLabel(product.stock)}</span><b>${Number(product.price).toFixed(0)} €</b></div>`).join('')}</div>`
  if (tab === 'products') {
    content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">INVENTORY</span><h2>Products</h2></div><button class="admin-action" id="admin-add-product">+ Add product</button></div><input class="admin-search" id="admin-product-search" placeholder="Search by name or OEM code"><div id="admin-product-form-holder"></div><div class="admin-table cols-5"><div class="admin-table-head"><span>Part</span><span>Category</span><span>Stock</span><span>Price</span><span>Actions</span></div>${products.map((product) => `<div class="admin-table-row" data-search="${(product.name + ' ' + (product.oem || '')).toLowerCase()}"><strong>${product.name}</strong><span>${product.category}</span><span class="stock-edit"><input type="number" min="0" value="${product.stock}" data-stock-id="${product.id}"></span><b>${Number(product.price).toFixed(0)} €</b><span class="row-actions"><button class="row-action" data-edit-id="${product.id}">Edit</button><button class="row-action" data-delete-id="${product.id}">Delete</button></span></div>`).join('')}</div><p class="admin-note" id="admin-products-message"></p>`
    document.querySelector('#admin-product-search').addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase()
      document.querySelectorAll('.admin-table-row[data-search]').forEach((row) => { row.hidden = query.length > 0 && !row.dataset.search.includes(query) })
    })
    document.querySelector('#admin-add-product').addEventListener('click', () => bindAdminProductForm(null))
    document.querySelectorAll('[data-edit-id]').forEach((button) => button.addEventListener('click', () => bindAdminProductForm(products.find((p) => p.id === button.dataset.editId))))
    document.querySelectorAll('[data-delete-id]').forEach((button) => button.addEventListener('click', async () => {
      if (!window.confirm('Delete this product?')) return
      await supabase.from('products').delete().eq('id', button.dataset.deleteId)
      await loadProducts()
      renderAdminTab('products')
    }))
    document.querySelectorAll('[data-stock-id]').forEach((input) => input.addEventListener('change', async () => {
      await supabase.from('products').update({ stock: Number(input.value) || 0 }).eq('id', input.dataset.stockId)
      await loadProducts()
    }))
  }
  if (tab === 'orders') {
    const { data: orders } = await supabase.from('orders').select('id, buyer_name, buyer_email, total, status, created_at').order('created_at', { ascending: false }).limit(50)
    let itemsByOrder = {}
    if (orders?.length) {
      const { data: items } = await supabase.from('order_items').select('order_id, product_name').in('order_id', orders.map((o) => o.id))
      items?.forEach((item) => { (itemsByOrder[item.order_id] ??= []).push(item.product_name) })
    }
    const today = new Date().toDateString()
    const todayOrders = orders?.filter((o) => new Date(o.created_at).toDateString() === today) || []
    const revenueToday = todayOrders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0)
    content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">FULFILLMENT</span><h2>Orders</h2></div></div><div class="admin-metrics"><div><span>Orders today</span><strong>${todayOrders.length}</strong></div><div><span>Awaiting shipment</span><strong class="warning">${orders?.filter((o) => o.status === 'pending').length || 0}</strong></div><div><span>Revenue today</span><strong>${revenueToday.toFixed(0)} €</strong></div></div><div class="admin-table cols-5">${orders?.length ? `<div class="admin-table-head"><span>Order</span><span>Items</span><span>Buyer</span><span>Total</span><span>Status</span></div>${orders.map((order) => `<div class="admin-table-row"><code>#${order.id}</code><span>${(itemsByOrder[order.id] || []).join(', ') || '-'}</span><span>${order.buyer_name}</span><b>${Number(order.total).toFixed(2)} €</b><select class="admin-select" data-order-status="${order.id}">${['pending', 'paid', 'shipped', 'completed', 'cancelled'].map((status) => `<option ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div>`).join('')}` : '<p class="admin-note">Vēl nav neviena pasūtījuma. Norēķinu / apmaksas sistēma tiks pievienota vēlāk — tagad klienti nosūta pasūtījuma pieprasījumu, un jūs sazināties, lai vienotos par apmaksu.</p>'}</div>`
    document.querySelectorAll('[data-order-status]').forEach((select) => select.addEventListener('change', async () => { await supabase.from('orders').update({ status: select.value }).eq('id', select.dataset.orderStatus) }))
  }
  if (tab === 'listings') {
    const { data: rows } = await supabase.from('listings').select('id, title, brand, model, price, location, status').neq('status', 'removed').order('created_at', { ascending: false }).limit(50)
    content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">COMMUNITY</span><h2>Community listings</h2></div><span class="admin-count">${rows?.length || 0} listings</span></div><p class="admin-note">New listings publish automatically — remove any that don't belong. Click a listing to see full details.</p><div id="admin-listing-detail"></div><div class="moderation-list">${rows?.length ? rows.map((row) => `<div class="moderation-row" data-view-id="${row.id}"><div><strong>${row.title}</strong><small>${row.brand || '-'} ${row.model || ''} · ${row.location || '-'} · ${row.price} € · <span class="status-pill">${row.status}</span></small></div><div>${row.status === 'pending' ? `<button class="approve-button" data-listing-action="active" data-listing-id="${row.id}">Approve</button>` : ''}<button class="reject-button" data-listing-action="removed" data-listing-id="${row.id}">Remove</button></div></div>`).join('') : '<p class="admin-note">No community listings yet.</p>'}</div>`
    document.querySelectorAll('[data-view-id]').forEach((row) => row.addEventListener('click', (event) => { if (event.target.closest('button')) return; showListingDetail(row.dataset.viewId) }))
  }
  if (tab === 'tasks') content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">OPERATIONS</span><h2>Team tasks</h2></div><button class="admin-action" id="admin-add-employee">+ Add employee</button></div><p class="admin-note">Šis ir demonstrācijas saraksts. Reāla darbinieku pārvaldība tiks pievienota vēlāk — pagaidām darbiniekus pievieno tieši Supabase Authentication panelī un piešķir tiem lomu (manager / warehouse / fulfillment) profiles tabulā.</p><div class="admin-table"><div class="admin-table-head"><span>Name</span><span>Role</span><span>Current task</span><span>Status</span></div>${[['Deniss', 'Owner', 'Reviewing pending listings', 'Active'], ['Andris', 'Warehouse staff', 'Restocking wheels & tires shelf', 'Active'], ['Laura', 'Order fulfillment', 'Packing recent orders', 'Away']].map((person) => `<div class="admin-table-row"><strong>${person[0]}</strong><span>${person[1]}</span><span>${person[2]}</span><span class="status-pill">${person[3]}</span></div>`).join('')}</div>`
  if (tab === 'settings') content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">CONFIGURATION</span><h2>Settings</h2></div></div><div class="settings-card"><h3>Account</h3><label>Admin e-mail<input value="${(await supabase.auth.getUser()).data.user?.email || ''}" readonly></label><label>Role<input value="Owner" readonly></label></div><div class="settings-card"><h3>Store</h3><label>Low stock alert threshold<input value="2" readonly></label><label>Free shipping threshold<input value="150 €" readonly></label><p class="admin-note">Šie iestatījumi pagaidām ir fiksēti kodā. Konfigurējama veikala iestatījumu tabula tiks pievienota vēlāk.</p></div>`
  bindListingActionButtons()
  document.querySelector('#admin-add-employee')?.addEventListener('click', () => { window.alert('Employee accounts can be added from Supabase Authentication. Then set their role (manager / warehouse / fulfillment) on their row in the profiles table to give them admin access.') })
}

function bindListingActionButtons() {
  document.querySelectorAll('[data-listing-action]').forEach((button) => button.addEventListener('click', async () => {
    await supabase.from('listings').update({ status: button.dataset.listingAction }).eq('id', button.dataset.listingId)
    renderAdminTab('listings')
  }))
}

async function showListingDetail(id) {
  const holder = document.querySelector('#admin-listing-detail')
  if (!holder) return
  holder.innerHTML = '<p class="admin-note">Loading...</p>'
  const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()
  if (!listing) { holder.innerHTML = '<p class="admin-note">Listing not found.</p>'; return }
  const [{ data: profile }, { data: images }] = await Promise.all([
    supabase.from('profiles').select('display_name, phone, city, username').eq('id', listing.user_id).single(),
    supabase.from('listing_images').select('storage_path').eq('listing_id', id).order('sort_order'),
  ])
  const imageUrls = (images || []).map((image) => supabase.storage.from('listing-images').getPublicUrl(image.storage_path).data.publicUrl)
  const conditionNames = { very_good: 'Ļoti labs', good: 'Labs', defect: 'Ar defektu' }
  holder.innerHTML = `<div class="admin-product-form"><h3>${listing.title}</h3><div class="detail-data"><span>STATUS<strong>${listing.status}</strong></span><span>PRICE<strong>${Number(listing.price).toFixed(2)} €</strong></span><span>BRAND / MODEL<strong>${listing.brand || '-'} ${listing.model || ''}</strong></span><span>YEAR / ENGINE<strong>${listing.production_year || '-'} / ${listing.engine || '-'}</strong></span><span>OEM NUMBER<strong>${listing.oem_number || '-'}</strong></span><span>CATEGORY<strong>${listing.category || '-'}</strong></span><span>CONDITION<strong>${conditionNames[listing.condition] || listing.condition || '-'}</strong></span><span>LOCATION<strong>${listing.location || '-'}</strong></span><span>DESCRIPTION<strong>${listing.description || 'No description provided.'}</strong></span><span>SELLER<strong>${profile?.display_name || 'Unknown'} · ${profile?.phone || 'no phone'}${profile?.city ? ' · ' + profile.city : ''}</strong></span><span>SUBMITTED<strong>${new Date(listing.created_at).toLocaleString('lv-LV')}</strong></span></div>${imageUrls.length ? `<div class="admin-listing-images">${imageUrls.map((url) => `<img src="${url}" alt="">`).join('')}</div>` : '<p class="admin-note">No photos uploaded.</p>'}<div class="form-actions">${listing.status === 'pending' ? `<button class="approve-button" data-listing-action="active" data-listing-id="${listing.id}">Approve</button>` : ''}<button class="reject-button" data-listing-action="removed" data-listing-id="${listing.id}">Remove</button><button class="text-button" type="button" id="admin-listing-detail-close">Close</button></div></div>`
  document.querySelector('#admin-listing-detail-close').addEventListener('click', () => { holder.innerHTML = '' })
  bindListingActionButtons()
}

const productDetailPage = `<section class="detail-page product-detail"><a class="back-link" href="#catalog">← ATPAKAĻ UZ KATALOGU</a><div class="detail-layout"><div><div id="product-gallery"></div><div class="section-kicker">KATALOGA PRECE</div><h1 id="product-title">Ielādē...</h1><p id="product-description" class="detail-description"></p><button class="button button-dark" id="product-add" type="button">PIEVIENOT GROZAM ↗</button></div><aside class="seller-panel"><span class="product-tag">IR NOLIKTAVĀ</span><strong id="product-price"></strong><div class="detail-data" id="product-data"></div></aside></div></section>`

function galleryMarkup(images) {
  const imgs = (images || []).filter(Boolean)
  if (!imgs.length) return `<div class="gallery"><div class="gallery-empty">Nav pievienotu bilžu</div></div>`
  return `<div class="gallery"><div class="gallery-main"><img src="${imgs[0]}" alt=""></div>${imgs.length > 1 ? `<button class="gallery-arrow gallery-prev" type="button" aria-label="Iepriekšējā bilde">‹</button><button class="gallery-arrow gallery-next" type="button" aria-label="Nākamā bilde">›</button><div class="gallery-dots">${imgs.map((_, i) => `<button class="gallery-dot${i === 0 ? ' active' : ''}" type="button" data-dot="${i}" aria-label="Bilde ${i + 1}"></button>`).join('')}</div>` : ''}</div>`
}

function bindGallery(container, images) {
  const imgs = (images || []).filter(Boolean)
  if (!container || !imgs.length) return
  let index = 0
  const img = container.querySelector('.gallery-main img')
  const dots = container.querySelectorAll('.gallery-dot')
  const show = (i) => {
    index = (i + imgs.length) % imgs.length
    img.src = imgs[index]
    dots.forEach((dot, d) => dot.classList.toggle('active', d === index))
  }
  container.querySelector('.gallery-prev')?.addEventListener('click', () => show(index - 1))
  container.querySelector('.gallery-next')?.addEventListener('click', () => show(index + 1))
  dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.dot))))
  img.addEventListener('click', () => openLightbox(imgs, index))
}

let lightboxImages = []
let lightboxIndex = 0

function openLightbox(images, startIndex) {
  lightboxImages = images
  lightboxIndex = startIndex || 0
  document.querySelector('#lightbox-image').src = lightboxImages[lightboxIndex]
  const hasMultiple = lightboxImages.length > 1
  document.querySelector('#lightbox-prev').hidden = !hasMultiple
  document.querySelector('#lightbox-next').hidden = !hasMultiple
  document.querySelector('#lightbox-overlay').hidden = false
}

function closeLightbox() {
  document.querySelector('#lightbox-overlay').hidden = true
}

function showLightboxImage(i) {
  lightboxIndex = (i + lightboxImages.length) % lightboxImages.length
  document.querySelector('#lightbox-image').src = lightboxImages[lightboxIndex]
}

document.querySelector('#lightbox-close').addEventListener('click', closeLightbox)
document.querySelector('#lightbox-overlay').addEventListener('click', (event) => { if (event.target.id === 'lightbox-overlay') closeLightbox() })
document.querySelector('#lightbox-prev').addEventListener('click', () => showLightboxImage(lightboxIndex - 1))
document.querySelector('#lightbox-next').addEventListener('click', () => showLightboxImage(lightboxIndex + 1))
document.addEventListener('keydown', (event) => {
  if (document.querySelector('#lightbox-overlay').hidden) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowLeft') showLightboxImage(lightboxIndex - 1)
  if (event.key === 'ArrowRight') showLightboxImage(lightboxIndex + 1)
})

function categoryPage(categoryValue) {
  const label = CATEGORIES.find((c) => c[3] === categoryValue)?.[1] || categoryValue
  const matchingProducts = products.filter((product) => (product.category || '').toLowerCase() === categoryValue).sort((a, b) => a.name.localeCompare(b.name, 'lv'))
  return `<section class="page-hero"><a class="back-link" href="#home">← ATPAKAĻ UZ SĀKUMU</a><div class="section-kicker">KATEGORIJA / <span>${label}</span></div><h1>${label}<br><em>detaļas.</em></h1><p>Šeit redzamas tikai <span>${label}</span> detaļas no kataloga un kopienas sludinājumiem.</p></section><section class="product-section category-products reveal"><div class="section-top"><div><div class="section-kicker">TRACKPARTS KATALOGS</div><h2>Kataloga <em>preces.</em></h2></div><a class="text-link" href="#catalog">VISAS KATEGORIJAS <span>↗</span></a></div>${matchingProducts.length ? productGridMarkup(matchingProducts) : '<p class="listing-loading">Šajā kategorijā pašlaik nav kataloga preču.</p>'}</section><section class="listings-section category-listings reveal"><div class="section-top"><div><div class="section-kicker">KOPIENAS SLUDINĀJUMI / <span>${label}</span></div><h2>Citi pārdod <em><span>${label}</span>.</em></h2></div><a class="button button-dark" href="#sell">PĀRDOT ŠEIT ↗</a></div><div class="listing-table" id="category-listing-table"><p class="listing-loading">Ielādējam sludinājumus...</p></div></section>`
}

function loadProductDetail(id) {
  const product = products.find((item) => item.id === id)
  if (!product) return
  const images = (product.images?.length ? product.images : [product.image]).filter(Boolean)
  document.querySelector('#product-gallery').innerHTML = galleryMarkup(images)
  bindGallery(document.querySelector('#product-gallery'), images)
  document.querySelector('#product-title').textContent = product.name
  document.querySelector('#product-description').textContent = product.description
  document.querySelector('#product-price').textContent = `${Number(product.price).toFixed(2).replace('.', ',')} €`
  document.querySelector('#product-data').innerHTML = `<span>OEM NUMURS<strong>${product.oem || '-'}</strong></span><span>RAŽOTĀJA KODS<strong>${product.code || '-'}</strong></span><span>RAŽOTĀJS<strong>${product.manufacturer || '-'}</strong></span><span>AUTO<strong>${product.brand || ''} ${product.model || ''}</strong></span><span>GADS / DZINĒJS<strong>${product.production_year || '-'} / ${product.engine || '-'}</strong></span><span>KATEGORIJA<strong>${product.category}</strong></span><span>STĀVOKLIS<strong>${product.condition || '-'}</strong></span><span>NOLIKTAVA<strong>${product.location || '-'} · Atlikums: ${stockLabel(product.stock)}</strong></span><span>SVARS / IZMĒRI<strong>${product.weight || '-'} · ${product.dimensions || '-'}</strong></span><span>GARANTIJA<strong>${product.warranty || '-'}</strong></span>`
  document.querySelector('#product-add').addEventListener('click', () => { addToCart(product); document.querySelector('#product-add').textContent = '✓ PIEVIENOTS GROZAM' })
}

async function loadListings() {
  const targets = document.querySelectorAll('#listing-table')
  if (!targets.length) return
  let rows = fallbackListings
  if (supabase) {
    const { data } = await supabase.from('listings').select('id, title, brand, model, condition, price, location').eq('status', 'active').order('created_at', { ascending: false }).limit(8)
    if (data?.length) rows = data
  }
  const conditionNames = { very_good: 'Ļoti labs', good: 'Labs', defect: 'Ar defektu' }
  targets.forEach((target) => {
    target.innerHTML = `<div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div>${rows.map((row, index) => `<a class="listing-row" href="#listing-${row.id || `demo-${index + 1}`}" ><strong>${row.title}</strong><span>${row.brand || '-'} ${row.model || ''}</span><span>${conditionNames[row.condition] || row.condition || 'Nav norādīts'}</span><b>${Number(row.price).toFixed(2).replace('.', ',')} €</b><span class="listing-arrow">↗</span></a>`).join('')}`
  })
}

async function loadCategoryListings(categoryValue) {
  const target = document.querySelector('#category-listing-table')
  if (!target) return
  let rows = fallbackListings.filter((row) => row.category?.toLowerCase() === categoryValue)
  if (supabase) {
    const { data } = await supabase.from('listings').select('id, title, brand, model, condition, price, location, category').eq('status', 'active').ilike('category', categoryValue).order('created_at', { ascending: false }).limit(8)
    if (data?.length) rows = data
  }
  const conditionNames = { very_good: 'Ļoti labs', good: 'Labs', defect: 'Ar defektu' }
  target.innerHTML = rows.length ? `<div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div>${rows.map((row, index) => `<a class="listing-row" href="#listing-${row.id || `demo-${index + 1}`}" ><strong>${row.title}</strong><span>${row.brand || '-'} ${row.model || ''}</span><span>${conditionNames[row.condition] || row.condition || 'Nav norādīts'}</span><b>${Number(row.price).toFixed(2).replace('.', ',')} €</b><span class="listing-arrow">↗</span></a>`).join('')}` : '<p class="listing-loading">Šajā kategorijā pašlaik nav aktīvu sludinājumu.</p>'
}

async function loadListingDetail(id) {
  let listing = fallbackListings.find((item) => item.id === id)
  if (supabase && !listing) {
    const { data } = await supabase.from('listings').select('id, title, description, price, condition, brand, model, production_year, engine, location, user_id').eq('id', id).single()
    if (data) {
      listing = { ...data, seller: 'Lietotājs', phone: 'Sazinies e-pastā' }
      const { data: profile } = await supabase.from('profiles').select('display_name, phone').eq('id', data.user_id).single()
      if (profile) listing = { ...listing, seller: profile.display_name || 'Lietotājs', phone: profile.phone || 'Sazinies e-pastā' }
    }
  }
  if (!listing) { document.querySelector('#detail-title').textContent = 'Sludinājums nav atrasts'; return }
  let images = []
  if (supabase && !listing.id.toString().startsWith('demo-')) {
    const { data: imageRows } = await supabase.from('listing_images').select('storage_path').eq('listing_id', id).order('sort_order')
    images = (imageRows || []).map((row) => supabase.storage.from('listing-images').getPublicUrl(row.storage_path).data.publicUrl)
  }
  document.querySelector('#detail-gallery').innerHTML = galleryMarkup(images)
  bindGallery(document.querySelector('#detail-gallery'), images)
  document.querySelector('#detail-title').textContent = listing.title
  document.querySelector('#detail-description').textContent = listing.description || 'Pārdevējs nav pievienojis aprakstu.'
  document.querySelector('#detail-price').textContent = `${Number(listing.price).toFixed(2).replace('.', ',')} €`
  document.querySelector('#detail-data').innerHTML = `<span>AUTO<strong>${listing.brand || '-'} ${listing.model || ''}</strong></span><span>STĀVOKLIS<strong>${listing.condition || 'Nav norādīts'}</strong></span><span>ATRAŠANĀS VIETA<strong>${listing.location || 'Nav norādīta'}</strong></span>`
  document.querySelector('#detail-seller').textContent = listing.seller || 'Privāts pārdevējs'
  const phone = document.querySelector('#detail-phone')
  phone.textContent = `${listing.phone || 'Sazināties ar pārdevēju'} ↗`
  if (listing.phone?.startsWith('+')) phone.href = `tel:${listing.phone.replaceAll(' ', '')}`
}

function recoveryFormMarkup() {
  return `<div class="section-kicker">JAUNA PAROLE</div><h2>Uzstādi <em>jaunu paroli.</em></h2><form id="recovery-form" class="site-form"><label>JAUNĀ PAROLE<input name="password" type="password" minlength="6" required></label><div class="form-actions"><button class="button button-dark" type="submit">SAGLABĀT PAROLI ↗</button></div><p class="form-message" id="recovery-message"></p></form>`
}

function myListingFormMarkup(listing, existingImages) {
  const l = listing || {}
  const images = existingImages || []
  return `<form class="admin-product-form" id="my-listing-form"><h3>Rediģēt sludinājumu</h3><input type="hidden" name="id" value="${l.id}"><label>NOSAUKUMS<input name="title" required value="${l.title || ''}"></label><div class="form-two"><label>CENA (€)<input name="price" type="number" min="0" step="0.01" required value="${l.price ?? ''}"></label><label>OEM NUMURS<input name="oem_number" value="${l.oem_number || ''}"></label></div><div class="form-two"><label>MARKA<input name="brand" value="${l.brand || ''}"></label><label>MODELIS<input name="model" value="${l.model || ''}"></label></div><div class="form-two"><label>GADS<input name="production_year" type="number" min="1950" max="2030" value="${l.production_year || ''}"></label><label>DZINĒJS<input name="engine" value="${l.engine || ''}"></label></div><div class="form-two"><label>KATEGORIJA<select name="category">${CATEGORIES.map((c) => { const value = c[1] === 'Riteņi & diski' ? 'Riteņi un diski' : c[1]; return `<option ${l.category === value ? 'selected' : ''}>${value}</option>` }).join('')}</select></label><label>ATRAŠANĀS VIETA<input name="location" value="${l.location || ''}"></label></div><label>STĀVOKLIS<select name="condition"><option value="very_good" ${l.condition === 'very_good' ? 'selected' : ''}>Ļoti labs</option><option value="good" ${l.condition === 'good' ? 'selected' : ''}>Labs</option><option value="defect" ${l.condition === 'defect' ? 'selected' : ''}>Ar defektu</option></select></label><label>APRAKSTS<textarea name="description" rows="4">${l.description || ''}</textarea></label>${images.length ? `<label>ESOŠĀS BILDES<div class="admin-listing-images">${images.map((url) => `<img src="${url}" alt="">`).join('')}</div></label>` : ''}<label>PIEVIENOT BILDES<input name="images" type="file" accept="image/*" multiple></label><div class="form-actions"><button class="button button-dark" type="submit">SAGLABĀT ↗</button><button class="text-button" type="button" id="my-listing-cancel">ATCELT</button></div><p class="admin-note" id="my-listing-message"></p></form>`
}

async function bindMyListingForm(listing, userId) {
  const holder = document.querySelector('#my-listing-form-holder')
  if (!holder) return
  let existingImagePaths = []
  let existingImageUrls = []
  if (listing) {
    const { data: images } = await supabase.from('listing_images').select('storage_path').eq('listing_id', listing.id).order('sort_order')
    existingImagePaths = images || []
    existingImageUrls = existingImagePaths.map((image) => supabase.storage.from('listing-images').getPublicUrl(image.storage_path).data.publicUrl)
  }
  holder.innerHTML = myListingFormMarkup(listing, existingImageUrls)
  document.querySelector('#my-listing-cancel').addEventListener('click', () => { holder.innerHTML = '' })
  document.querySelector('#my-listing-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector('#my-listing-message')
    const data = new FormData(event.target)
    const listingId = data.get('id')
    const row = { title: data.get('title'), price: Number(data.get('price')), oem_number: data.get('oem_number'), brand: data.get('brand'), model: data.get('model'), production_year: Number(data.get('production_year')) || null, engine: data.get('engine'), category: data.get('category'), location: data.get('location'), condition: data.get('condition'), description: data.get('description') }
    const { error } = await supabase.from('listings').update(row).eq('id', listingId).eq('user_id', userId)
    if (error) { message.textContent = error.message; return }
    const files = [...data.getAll('images')].filter((file) => file.size)
    if (files.length) message.textContent = `Augšupielādē ${files.length} ${files.length === 1 ? 'bildi' : 'bildes'}...`
    const uploadResults = await Promise.all(files.map(async (file, index) => {
      const path = `${userId}/${listingId}/${Date.now()}-${index}-${file.name}`
      const upload = await supabase.storage.from('listing-images').upload(path, file)
      if (upload.error) return upload.error
      await supabase.from('listing_images').insert({ listing_id: listingId, storage_path: path, sort_order: existingImagePaths.length + index })
      return null
    }))
    const uploadError = uploadResults.find(Boolean)
    if (uploadError) { message.textContent = `Izmaiņas saglabātas, bet bildes neizdevās augšupielādēt: ${uploadError.message}`; return }
    holder.innerHTML = ''
    await loadMyListings(userId)
  })
}

async function loadMyListings(userId) {
  const holder = document.querySelector('#my-listings')
  if (!holder) return
  const { data: rows } = await supabase.from('listings').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  const statusNames = { pending: 'Gaida apstiprinājumu', active: 'Aktīvs', reserved: 'Rezervēts', sold: 'Pārdots', removed: 'Noņemts' }
  holder.innerHTML = `<div id="my-listing-form-holder"></div>${rows?.length ? `<div class="admin-table cols-5"><div class="admin-table-head"><span>SLUDINĀJUMS</span><span>AUTO</span><span>CENA</span><span>STATUSS</span><span>DARBĪBAS</span></div>${rows.map((row) => `<div class="admin-table-row"><strong>${row.title}</strong><span>${row.brand || '-'} ${row.model || ''}</span><b>${Number(row.price).toFixed(0)} €</b><span class="status-pill">${statusNames[row.status] || row.status}</span><span class="row-actions"><button class="row-action" data-my-edit-id="${row.id}">Rediģēt</button><button class="row-action" data-my-remove-id="${row.id}">Dzēst</button></span></div>`).join('')}</div>` : '<p class="listing-loading">Tev vēl nav neviena sludinājuma.</p>'}`
  document.querySelectorAll('[data-my-edit-id]').forEach((button) => button.addEventListener('click', () => bindMyListingForm(rows.find((row) => row.id.toString() === button.dataset.myEditId), userId)))
  document.querySelectorAll('[data-my-remove-id]').forEach((button) => button.addEventListener('click', async () => {
    if (!window.confirm('Dzēst šo sludinājumu?')) return
    await supabase.from('listings').delete().eq('id', button.dataset.myRemoveId).eq('user_id', userId)
    await loadMyListings(userId)
  }))
}

async function initAccountPage() {
  const holder = document.querySelector('#account-content')
  if (!holder || !supabase) return
  if (pendingAuthEvent === 'recovery') {
    holder.innerHTML = recoveryFormMarkup()
    document.querySelector('#recovery-form').addEventListener('submit', async (event) => {
      event.preventDefault()
      const password = new FormData(event.target).get('password')
      const { error } = await supabase.auth.updateUser({ password })
      document.querySelector('#recovery-message').textContent = error ? error.message : 'Parole atjaunota! Tagad vari izmantot jauno paroli.'
      if (!error) { pendingAuthEvent = null; setTimeout(() => { initAccountPage() }, 1500) }
    })
    return
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('display_name, phone, city, username').eq('id', user.id).single()
  const confirmedBanner = pendingAuthEvent === 'confirmed' ? '<p class="form-message">E-pasts apstiprināts — tu esi ielogojies!</p>' : ''
  pendingAuthEvent = null
  holder.innerHTML = `<div class="section-kicker">LIETOTĀJA PIEKĻUVE</div><h2>Sveiks, <em>${profile?.display_name || user.email}!</em></h2>${confirmedBanner}<p><span>Tu esi ielogojies kā</span> <b>${user.email}</b>.</p><form class="site-form" id="profile-form"><label>VĀRDS<input name="display_name" value="${profile?.display_name || ''}"></label><div class="form-two"><label>TĀLRUNIS<input name="phone" value="${profile?.phone || ''}"></label><label>PILSĒTA<input name="city" value="${profile?.city || ''}"></label></div><label>LIETOTĀJVĀRDS<input name="username" value="${profile?.username || ''}"></label><div class="form-actions"><button class="button button-dark" type="submit">SAGLABĀT IZMAIŅAS ↗</button></div><p class="form-message" id="profile-message"></p></form><div class="form-actions"><a class="button button-dark" href="#sell">PĀRDOT DETAĻU ↗</a><button class="text-button" id="logout-button" type="button">IZIET</button></div><div class="section-kicker">MANI SLUDINĀJUMI</div><h2>Tavi <em>sludinājumi.</em></h2><div id="my-listings"><p class="listing-loading">Ielādējam sludinājumus...</p></div>`
  document.querySelector('#logout-button').addEventListener('click', async () => { await supabase.auth.signOut(); window.location.hash = 'home'; renderPage() })
  document.querySelector('#profile-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector('#profile-message')
    const data = new FormData(event.target)
    const { error } = await supabase.from('profiles').update({ display_name: data.get('display_name'), phone: data.get('phone'), city: data.get('city'), username: data.get('username') || null }).eq('id', user.id)
    message.textContent = error ? error.message : 'Profils saglabāts.'
  })
  await loadMyListings(user.id)
}

function bindRouteForms(route) {
  if (!supabase) return
  const authForm = document.querySelector('#auth-form')
  const authMessage = document.querySelector('#auth-message')
  if (authForm) {
    authForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const data = new FormData(authForm)
      if (!data.get('email') || !data.get('password')) { authMessage.textContent = 'Ievadi e-pastu un paroli.'; return }
      const { error } = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') })
      authMessage.textContent = error ? error.message : 'Veiksmīgi ielogojies.'
      if (!error) { window.location.hash = 'sell' }
    })
    document.querySelector('#signup-button').addEventListener('click', async () => {
      const data = new FormData(authForm)
      if (!data.get('email') || !data.get('password')) { authMessage.textContent = 'Ievadi e-pastu un paroli, lai izveidotu kontu.'; return }
      if (!data.get('consent')) { authMessage.textContent = 'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.'; return }
      const { error } = await supabase.auth.signUp({ email: data.get('email'), password: data.get('password'), options: { emailRedirectTo: `${SITE_URL}#account` } })
      authMessage.textContent = error ? error.message : 'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.'
    })
    document.querySelector('#forgot-password').addEventListener('click', async () => {
      const email = new FormData(authForm).get('email')
      if (!email) { authMessage.textContent = 'Ievadi e-pastu, lai atjaunotu paroli.'; return }
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}#account` })
      authMessage.textContent = error ? error.message : 'Paroles atjaunošanas saite nosūtīta uz e-pastu.'
    })
  }

  const listingForm = document.querySelector('#listing-form')
  if (listingForm) listingForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector('#listing-message')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { message.textContent = 'Lai ievietotu sludinājumu, vispirms ielogojies.'; openAuthModal('login'); return }
    const formData = new FormData(listingForm)
    const { data: listing, error } = await supabase.from('listings').insert({ user_id: user.id, title: formData.get('title'), price: Number(formData.get('price')), oem_number: formData.get('oem_number'), brand: formData.get('brand'), model: formData.get('model'), production_year: Number(formData.get('production_year')) || null, engine: formData.get('engine'), category: formData.get('category'), location: formData.get('location'), condition: formData.get('condition'), description: formData.get('description'), status: 'active' }).select().single()
    if (error) { message.textContent = error.message; return }
    const files = [...formData.getAll('images')].filter((file) => file.size)
    if (files.length) message.textContent = `Augšupielādē ${files.length} ${files.length === 1 ? 'bildi' : 'bildes'}...`
    const uploadResults = await Promise.all(files.map(async (file, index) => {
      const path = `${user.id}/${listing.id}/${Date.now()}-${index}-${file.name}`
      const upload = await supabase.storage.from('listing-images').upload(path, file)
      if (upload.error) return upload.error
      await supabase.from('listing_images').insert({ listing_id: listing.id, storage_path: path, sort_order: index })
      return null
    }))
    const uploadError = uploadResults.find(Boolean)
    message.textContent = uploadError ? `Sludinājums publicēts, bet bildes neizdevās augšupielādēt: ${uploadError.message}` : 'Sludinājums publicēts! Pārvaldi to savā kontā (Mans konts).'
    listingForm.reset()
  })
  if (route === 'sell') supabase.auth.getUser().then(({ data: { user } }) => { if (!user) document.querySelector('#listing-message').textContent = 'Ielogojies, lai publicētu sludinājumu.' })
}

function playPageWipe(callback) {
  const wipe = document.querySelector('#page-wipe')
  if (!wipe || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { callback(); return }
  wipe.classList.add('wipe-cover')
  wipe.addEventListener('transitionend', function onCovered(e) {
    if (e.propertyName !== 'transform') return
    wipe.removeEventListener('transitionend', onCovered)
    callback()
    wipe.classList.remove('wipe-cover')
    wipe.classList.add('wipe-reveal')
    wipe.addEventListener('transitionend', function onRevealed(e2) {
      if (e2.propertyName !== 'transform') return
      wipe.removeEventListener('transitionend', onRevealed)
      wipe.style.transition = 'none'
      wipe.classList.remove('wipe-reveal')
      wipe.offsetHeight
      wipe.style.transition = ''
    })
  })
}

let english = false
window.addEventListener('hashchange', () => playPageWipe(renderPage))
renderPage()
loadProducts().then(() => { if (!window.location.hash.includes('access_token')) renderPage() })

const translations = {
  'Sākums': 'Home', 'Katalogs': 'Catalog', 'Sludinājumi': 'Listings', 'Pārdot detaļu': 'Sell a part', 'Mans konts': 'My account', 'Kontakti': 'Contact',
  'KVALITĀTES LIETOTAS DETAĻAS · PIEGĀDE VISĀ EIROPĀ': 'QUALITY USED PARTS · SHIPPING ACROSS EUROPE', 'BEZMAKSA PIEGĀDE NO 150 €': 'FREE SHIPPING FROM €150',
  'GROZS': 'CART', 'TAVS GROZS': 'YOUR CART', 'Atlasītās': 'Selected', 'detaļas.': 'parts.', 'KOPĀ': 'TOTAL', 'UZ NORĒĶINU ↗': 'CHECKOUT ↗', 'NOTĪRĪT GROZU': 'CLEAR CART', 'Grozs ir tukšs.': 'Cart is empty.',
  'PASŪTĪJUMA PIEPRASĪJUMS': 'ORDER REQUEST', 'Pabeidz': 'Complete', 'pasūtījumu.': 'your order.',
  "Apmaksa tiešsaistē vēl nav pieejama — pēc pieprasījuma nosūtīšanas mēs sazināsimies pa e-pastu, lai vienotos par apmaksu un piegādi.": "Online payment isn't available yet — after you send the request we'll contact you by email to arrange payment and delivery.",
  'VĀRDS, UZVĀRDS': 'FULL NAME', 'E-PASTS': 'EMAIL', 'TĀLRUNIS': 'PHONE', 'PIEGĀDES ADRESE': 'DELIVERY ADDRESS', 'PIEZĪMES': 'NOTES', 'NOSŪTĪT': 'SEND', '← ATPAKAĻ': '← BACK',
  'PALDIES!': 'THANKS!', 'Pasūtījums': 'Order', 'saņemts.': 'received.', 'AIZVĒRT': 'CLOSE',
  'DETĀĻAS, KURĀM VAR UZTICĒTIES': 'PARTS YOU CAN TRUST', 'Tava automašīna.': 'Your car.', 'Mūsu detaļas.': 'Our parts.',
  'Pārbaudītas lietotas auto detaļas. Atrastas ātri, nosūtītas droši.': 'Checked used car parts. Found fast, shipped safely.', 'SKATĪT KATALOGU': 'BROWSE CATALOG',
  'DETAĻAS': 'PARTS', 'NOLIKTAVĀ': 'IN STOCK', 'ĀTRA': 'FAST', 'IZSŪTĪŠANA': 'SHIPPING', 'PIEGĀDE': 'SHIPPING', 'VISĀ EIROPĀ': 'ACROSS EUROPE',
  '01 / ATRODI SAVU DETAĻU': '01 / FIND YOUR PART', 'Ko tu meklē?': 'What are you looking for?', 'Meklē pēc nosaukuma, OEM koda vai detaļas numura.': 'Search by name, OEM code or part number.',
  'MEKLĒT': 'SEARCH', 'MARKA': 'BRAND', 'Visas markas': 'All brands', 'MODELIS': 'MODEL', 'Visi modeļi': 'All models', 'DETAĻAS TIPS': 'PART TYPE', 'Visas kategorijas': 'All categories',
  'KĀRTOT': 'SORT', 'Cena: no zemākās': 'Price: low to high', 'Cena: no augstākās': 'Price: high to low',
  '+ VAIRĀK FILTRU': '+ MORE FILTERS', '- MAZĀK FILTRU': '- FEWER FILTERS', 'STĀVOKLIS': 'CONDITION', 'Jebkurš': 'Any', 'Ļoti labs': 'Very good', 'Labs': 'Good', 'Pārbaudīts': 'Tested', 'Pārbaudīta': 'Tested', 'Ar defektu': 'Has a defect',
  'CENA NO (€)': 'PRICE FROM (€)', 'CENA LĪDZ (€)': 'PRICE TO (€)', 'GADS': 'YEAR',
  'MARKAS, KO PAZĪSTAM': 'BRANDS WE KNOW',
  '02 / IZPĒTI KATEGORIJAS': '02 / EXPLORE CATEGORIES', 'Viss, kas vajadzīgs': 'Everything you need', 'tavam auto.': 'for your car.', 'SKATĪT VISU': 'SEE ALL',
  'Dzinējs': 'Engine', 'Virsbūve': 'Body', 'Salons': 'Interior', 'Balstiekārta': 'Suspension', 'Elektrība': 'Electrical', 'Riteņi & diski': 'Wheels & tires', 'Riteņi un diski': 'Wheels & tires',
  '03 / JAUNUMI NOLIKTAVĀ': '03 / NEW IN STOCK', 'Pēdējie': 'Latest', 'atradumi.': 'finds.', 'SKATĪT VISUS': 'SEE ALL', 'PIEVIENOT': 'ADD', 'PRECES': 'PARTS',
  '04 / KOPIENAS SLUDINĀJUMI': '04 / COMMUNITY LISTINGS', 'Ko pārdod': 'What others', 'citi.': 'sell.', 'PĀRDOT SAVU DETAĻU': 'SELL YOUR PART',
  'Ielādējam sludinājumus...': 'Loading listings...', 'DETAĻA': 'PART', 'AUTO': 'CAR', 'CENA': 'PRICE', 'Nav norādīts': 'Not specified',
  'Pārbaudīta kvalitāte': 'Checked quality', 'Katra detaļa tiek apskatīta pirms nosūtīšanas.': 'Every part is inspected before shipping.',
  'Piegāde Eiropā': 'European shipping', 'No mūsu noliktavas Rīgā līdz tavām durvīm.': 'From our warehouse in Riga to your door.',
  'Atbalsts 7 dienas': 'Support 7 days', "Zini, ko pērc. Mēs palīdzēsim atrast pareizo.": "Know what you're buying. We'll help you find the right part.",
  'Rīga, Latvija': 'Riga, Latvia',
  '02 / PREČU KATALOGS': '02 / PRODUCT CATALOG', 'Atrodi detaļu.': 'Find your part.', 'Uztaisi ātrāku.': 'Go faster.',
  'Oriģinālas un pārbaudītas detaļas ielas auto, trases projektam un servisam.': 'Original, inspected parts for street cars, track builds and repairs.',
  'FILTRĒ KATALOGU': 'FILTER CATALOG', 'VISAS DETAĻAS': 'ALL PARTS', 'Noliktavā': 'In stock', 'tagad.': 'now.', 'Neviena detaļa neatbilst meklējumam.': 'No parts match your search.',
  '03 / PAR TRACKPARTS': '03 / ABOUT TRACKPARTS', 'Mēs atrodam labas detaļas cilvēkiem, kuri paši zina, cik svarīgs ir katrs pagrieziens.': 'We find good parts for people who know how much every corner matters.',
  'MŪSU PIEEJA': 'OUR APPROACH', 'Nevis detaļu kaudze.': 'Not a pile of parts.', 'Īstais atradums.': 'The right find.',
  "TrackParts sākās Rīgā ar vienu vienkāršu ideju: lietotai detaļai nav jābūt kompromisam. Katra detaļa tiek pārbaudīta, nofotografēta un marķēta, lai tu vari pirkt ar pārliecību.": "TrackParts started in Riga with one simple idea: a used part shouldn't mean a compromise. Every part is inspected, photographed and labelled so you can buy with confidence.",
  'Mūsu noliktavā katram kodam ir sava vieta, statuss un vēsture. Mazāk minēšanas, vairāk laika uz ceļa.': 'In our warehouse, every code has its own place, status and history. Less guessing, more time on the road.',
  "Katrs produkts tiek apskatīts pirms pārdošanas.": "Every product is inspected before it's sold.", 'No Rīgas līdz tavām durvīm.': 'From Riga to your door.',
  'Cilvēcīgs atbalsts': 'Human support', "Palīdzēsim atrast pareizo detaļu.": "We'll help you find the right part.",
  '04 / SAZINĀSIMIES': '04 / GET IN TOUCH', 'Ir jautājums?': 'Got a question?', 'Dod ziņu.': 'Send us a note.',
  "Neatrodi detaļu katalogā? Atsūti VIN, OEM kodu vai bildi, un mēs paskatīsimies.": "Can't find a part in the catalog? Send us the VIN, OEM code or a photo and we'll take a look.",
  'RAKSTI MUMS': 'WRITE TO US', 'Atbildēsim': "We'll reply", 'ātri.': 'fast.', 'TELEFONS': 'PHONE', 'ATRODI MŪS': 'FIND US',
  '05 / TAVS KONTS': '05 / YOUR ACCOUNT', 'Pieslēdzies.': 'Sign in.', 'Pārdod.': 'Sell.',
  'Izveido kontu, lai ievietotu detaļas un pārvaldītu savus sludinājumus.': 'Create an account to post parts and manage your listings.',
  'LIETOTĀJA PIEKĻUVE': 'USER ACCESS', 'Ienākt vai': 'Sign in or', 'reģistrēties.': 'sign up.', 'PAROLE': 'PASSWORD',
  'IELOGOTIES ↗': 'SIGN IN ↗', 'IZVEIDOT KONTU': 'CREATE ACCOUNT', 'IZVEIDOT KONTU ↗': 'CREATE ACCOUNT ↗', 'AIZMIRSI PAROLI?': 'FORGOT PASSWORD?',
  'IELOGOTIES': 'SIGN IN', 'REĢISTRĒTIES': 'SIGN UP', 'Sveicināts': 'Welcome to', 'TrackParts.': 'TrackParts.',
  'Ievadi e-pastu un paroli.': 'Enter your email and password.', 'Ievadi e-pastu, lai atjaunotu paroli.': 'Enter your email to reset your password.',
  'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.': 'Account created. Check your email and click the confirmation link.',
  'Paroles atjaunošanas saite nosūtīta uz e-pastu.': 'Password reset link sent to your email.',
  'Sveiks,': 'Hi,', 'Tu esi ielogojies kā': "You're signed in as", 'PĀRDOT DETAĻU ↗': 'SELL A PART ↗', 'IZIET': 'LOG OUT',
  "E-pasts apstiprināts — tu esi ielogojies!": "Email confirmed — you're signed in!",
  'VĀRDS': 'NAME', 'PILSĒTA': 'CITY', 'LIETOTĀJVĀRDS': 'USERNAME', 'SAGLABĀT IZMAIŅAS ↗': 'SAVE CHANGES ↗', 'Profils saglabāts.': 'Profile saved.',
  'MANI SLUDINĀJUMI': 'MY LISTINGS', 'Tavi': 'Your', 'Rediģēt sludinājumu': 'Edit listing', 'SAGLABĀT ↗': 'SAVE ↗', 'ATCELT': 'CANCEL',
  'SLUDINĀJUMS': 'LISTING', 'STATUSS': 'STATUS', 'DARBĪBAS': 'ACTIONS', 'Rediģēt': 'Edit', 'Dzēst': 'Delete', 'Tev vēl nav neviena sludinājuma.': "You don't have any listings yet.",
  'Gaida apstiprinājumu': 'Awaiting approval', 'Aktīvs': 'Active', 'Rezervēts': 'Reserved', 'Pārdots': 'Sold', 'Noņemts': 'Removed',
  'Sludinājums publicēts! Pārvaldi to savā kontā (Mans konts).': 'Listing published! Manage it from your account (My account).',
  'JAUNA PAROLE': 'NEW PASSWORD', 'Uzstādi': 'Set', 'jaunu paroli.': 'a new password.', 'JAUNĀ PAROLE': 'NEW PASSWORD', 'SAGLABĀT PAROLI ↗': 'SAVE PASSWORD ↗',
  '06 / JAUNS SLUDINĀJUMS': '06 / NEW LISTING', 'Ieliec detaļu': 'Put your part', 'uz ceļa.': 'on the road.',
  'Aizpildi informāciju, pievieno bildes un sasniedz cilvēku, kuram tā vajadzīga.': 'Fill in the details, add photos, and reach the person who needs it.',
  'DETAĻAS INFORMĀCIJA': 'PART INFORMATION', 'Ko tu': 'What are', 'pārdod?': 'you selling?',
  'NOSAUKUMS': 'TITLE', 'CENA (€)': 'PRICE (€)', 'OEM NUMURS': 'OEM NUMBER', 'DZINĒJS': 'ENGINE', 'KATEGORIJA': 'CATEGORY', 'ATRAŠANĀS VIETA': 'LOCATION',
  'APRAKSTS': 'DESCRIPTION', 'BILDES': 'PHOTOS', 'PUBLICĒT SLUDINĀJUMU ↗': 'PUBLISH LISTING ↗', 'ESOŠĀS BILDES': 'EXISTING PHOTOS', 'PIEVIENOT BILDES': 'ADD PHOTOS', 'Nav pievienotu bilžu': 'No photos added',
  '04 / KOPIENAS TIRGUS': '04 / COMMUNITY MARKETPLACE', 'Redzi, ko citi': 'See what others', 'pārdod.': 'are selling.',
  "Īstas detaļas no TrackParts kopienas. Atver sludinājumu, lai redzētu pārdevēju un sazinātos.": 'Real parts from the TrackParts community. Open a listing to see the seller and get in touch.',
  'AKTĪVIE SLUDINĀJUMI': 'ACTIVE LISTINGS', 'Jaunākie': 'Latest', 'sludinājumi.': 'listings.',
  '← ATPAKAĻ UZ SLUDINĀJUMIEM': '← BACK TO LISTINGS', 'SLUDINĀJUMA INFORMĀCIJA': 'LISTING INFORMATION', 'AKTĪVS SLUDINĀJUMS': 'ACTIVE LISTING',
  'PĀRDEVĒJS': 'SELLER', 'SAZINĀTIES ↗': 'CONTACT ↗', 'RAKSTĪT E-PASTU ↗': 'EMAIL US ↗',
  '← ATPAKAĻ UZ KATALOGU': '← BACK TO CATALOG', 'KATALOGA PRECE': 'CATALOG ITEM', 'PIEVIENOT GROZAM ↗': 'ADD TO CART ↗', '✓ PIEVIENOTS GROZAM': '✓ ADDED TO CART', 'IR NOLIKTAVĀ': 'IN STOCK',
  'RAŽOTĀJA KODS': 'PART CODE', 'RAŽOTĀJS': 'MANUFACTURER', 'GADS / DZINĒJS': 'YEAR / ENGINE', 'NOLIKTAVA': 'WAREHOUSE', 'SVARS / IZMĒRI': 'WEIGHT / DIMENSIONS', 'GARANTIJA': 'WARRANTY',
  'TRACKPARTS KATALOGS': 'TRACKPARTS CATALOG', 'Kataloga': 'Catalog', 'preces.': 'items.', 'VISAS KATEGORIJAS': 'ALL CATEGORIES', 'PĀRDOT ŠEIT ↗': 'SELL HERE ↗',
  'KATEGORIJA /': 'CATEGORY /', 'Šeit redzamas tikai': 'Only showing', 'detaļas no kataloga un kopienas sludinājumiem.': 'parts from the catalog and community listings.', 'KOPIENAS SLUDINĀJUMI /': 'COMMUNITY LISTINGS /', 'Lietota detaļa': 'Used part',
  'Šajā kategorijā pašlaik nav kataloga preču.': 'No catalog items in this category yet.', 'Šajā kategorijā pašlaik nav aktīvu sludinājumu.': 'No active listings in this category yet.',
  '← ATPAKAĻ UZ SĀKUMU': '← BACK TO HOME', 'Citi pārdod': 'Others sell', 'Pievieno detaļu grozam vispirms.': 'Add a part to your cart first.',
  'VEIKALS': 'SHOP', 'Jaunas detaļas': 'New parts', 'Lietotas detaļas': 'Used parts', 'Kategorijas': 'Categories',
  'PALĪDZĪBA': 'HELP', 'Piegāde': 'Delivery', 'Atgriešana': 'Returns', 'RUNĀSIM': "LET'S TALK",
  'Lietošanas noteikumi': 'Terms of use', 'Privātuma politika': 'Privacy policy',
  'LIETOŠANAS NOTEIKUMI': 'TERMS OF USE', 'Noteikumi.': 'Terms.', 'Skaidri un godīgi.': 'Clear and fair.', 'Šie noteikumi regulē TrackParts interneta veikala un sludinājumu platformas lietošanu.': 'These terms govern the use of the TrackParts online store and listings platform.',
  'PRIVĀTUMA POLITIKA': 'PRIVACY POLICY', 'Tavi dati.': 'Your data.', 'Mūsu atbildība.': 'Our responsibility.', 'Šī politika izskaidro, kādus personas datus TrackParts apstrādā un kāpēc, saskaņā ar Vispārīgo datu aizsardzības regulu (VDAR/GDPR).': 'This policy explains what personal data TrackParts processes and why, in accordance with the General Data Protection Regulation (GDPR).',
  'Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.': 'This document is only available in Latvian. Contact us if you need a translation.',
  'Piekrītu': 'I agree to the', 'un': 'and', 'Privātuma politikai': 'Privacy Policy', 'Lietošanas noteikumiem': 'Terms of Use', '(nepieciešams, veidojot jaunu kontu).': '(required when creating a new account).',
  'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.': 'You must agree to the Terms of Use and Privacy Policy to create an account.',
  'Šī vietne izmanto tikai tehniski nepieciešamu lokālo glabātuvi, lai uzturētu tavu pieslēgšanās sesiju. Uzzini vairāk mūsu': 'This site only uses technically necessary local storage to keep you signed in. Learn more in our', 'SAPRATU': 'GOT IT', 'Privātuma politikā': 'Privacy Policy',
  'Auto detaļas bez liekām': 'Car parts without the', 'rūpēm.': 'hassle.',
}
const placeholderTranslations = {
  'Piem., BMW F10 lukturis vai 63117203298': 'E.g. BMW F10 headlight or 63117203298',
  'tavs@epasts.lv': 'you@email.com',
  'Vismaz 6 simboli': 'At least 6 characters',
  'Piem., BMW E46 priekšējais lukturis': 'E.g. BMW E46 front headlight',
  'Rīga, noliktava B3': 'Riga, warehouse B3',
  'Apraksti detaļas stāvokli un zināmos defektus': "Describe the part's condition and any known defects",
  'Piem., 2012': 'E.g. 2012',
}
const originalText = new WeakMap()
function translatePage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes = []
  let node
  while ((node = walker.nextNode())) textNodes.push(node)
  textNodes.forEach((textNode) => {
    const original = originalText.get(textNode) || textNode.nodeValue.trim()
    if (!original || textNode.parentElement?.tagName === 'SCRIPT') return
    if (!originalText.has(textNode)) originalText.set(textNode, original)
    const translated = english ? (translations[original] || original) : originalText.get(textNode)
    textNode.nodeValue = textNode.nodeValue.replace(textNode.nodeValue.trim(), translated)
  })
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((input) => {
    if (!input.dataset.lvPlaceholder) input.dataset.lvPlaceholder = input.placeholder
    input.placeholder = english ? (placeholderTranslations[input.dataset.lvPlaceholder] || input.dataset.lvPlaceholder) : input.dataset.lvPlaceholder
  })
  const languageButton = document.querySelector('.lang')
  if (languageButton) languageButton.innerHTML = english ? 'EN <small>/ LV</small>' : 'LV <small>/ EN</small>'
}
document.querySelector('.lang').addEventListener('click', () => { english = !english; translatePage() })
