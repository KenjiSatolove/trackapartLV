import './style.css'
import { supabase } from './lib/supabase.js'

const products = [
  { name: 'BMW F10 priekšējais kreisais lukturis', type: 'Lietota detaļa', price: 249, code: 'USED-BMW-F10-00152', image: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=85', tag: 'Ļoti labs' },
  { name: 'BMW E46 M3 aizmugurējais tilts', type: 'Lietota detaļa', price: 390, code: 'USED-BMW-E46-00881', image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=85', tag: 'Pēdējais gabals' },
  { name: 'Audi A4 B8 2.0 TDI turbīna', type: 'Lietota detaļa', price: 185, code: 'USED-AUD-B8-00304', image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=85', tag: 'Pārbaudīta' },
  { name: 'Mercedes-Benz W204 AMG bremžu suports', type: 'Lietota detaļa', price: 129, code: 'USED-MER-W204-00027', image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=85', tag: 'Ļoti labs' },
]

const categories = [
  ['01', 'Dzinējs', '⚙'], ['02', 'Virsbūve', '◒'], ['03', 'Salons', '▣'], ['04', 'Balstiekārta', '◈'], ['05', 'Elektrība', 'ϟ'], ['06', 'Riteņi & diski', '◉'],
]

document.querySelector('#app').innerHTML = `
  <div class="announcement">KVALITĀTES LIETOTAS DETAĻAS · PIEGĀDE VISĀ EIROPĀ <span>BEZMAKSAS PIEGĀDE NO 150 €</span></div>
  <header class="site-header">
    <a class="brand" href="#"><img src="image-removebg-preview.png" alt="TrackParts LV logo"></a>
    <nav class="main-nav"><a class="active" href="#home">Sākums</a><a href="#catalog">Katalogs</a><a href="#listings">Sludinājumi</a><a href="#sell">Pārdot detaļu</a><a href="#account">Mans konts</a><a href="#contact">Kontakti</a></nav>
    <div class="header-actions"><button class="lang" type="button">LV <small>/ EN</small></button><button class="icon-button" aria-label="Meklēt">⌕</button><button class="icon-button user-button" aria-label="Mans konts">◎</button><button class="cart-button" type="button" aria-label="Grozs">GROZS <b id="cart-count">0</b></button></div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy"><p class="eyebrow">DETĀĻAS, KURĀM VAR UZTICĒTIES</p><h1>Tava automašīna.<br><em>Mūsu detaļas.</em></h1><p class="hero-text">Pārbaudītas lietotas auto detaļas. Atrastas ātri, nosūtītas droši.</p><a class="button button-light" href="#catalog">SKATĪT KATALOGU <span>↗</span></a></div>
      <div class="hero-visual"><img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=90" alt="Autosporta auto trasē"><div class="hero-label">EST. 2024 <i></i> RĪGA, LV</div><div class="hero-spec">01 <span>TRACKPARTS</span></div></div>
      <div class="hero-stats"><div><strong>10k+</strong><span>DETAĻAS<br>NOLIKTAVĀ</span></div><div><strong>24h</strong><span>ĀTRA<br>IZSŪTĪŠANA</span></div><div><strong>EU</strong><span>PIEGĀDE<br>VISĀ EIROPĀ</span></div></div>
    </section>

    <section class="search-section" id="catalog"><div class="section-kicker">01 / ATRODI SAVU DETAĻU</div><div class="search-heading"><h2>Ko tu meklē?</h2><p>Meklē pēc nosaukuma, OEM koda vai detaļas numura.</p></div><form class="search-box" id="search-form"><span>⌕</span><input id="search-input" placeholder="Piem., BMW F10 lukturis vai 63117203298"/><button type="submit">MEKLĒT <b>↗</b></button></form><div class="select-row"><label>MARKA<select><option>Visas markas</option><option>BMW</option><option>Audi</option><option>Mercedes-Benz</option></select></label><label>MODELIS<select><option>Visi modeļi</option><option>F10</option><option>E46</option><option>A4 B8</option></select></label><label>DETAĻAS TIPS<select><option>Visas kategorijas</option><option>Motora detaļas</option><option>Virsbūve</option><option>Salons</option></select></label><button class="filter-button" type="button">+ VAIRĀK FILTRU</button></div></section>

    <section class="category-section"><div class="section-top"><div><div class="section-kicker">02 / IZPĒTI KATEGORIJAS</div><h2>Viss, kas vajadzīgs<br><em>tavam auto.</em></h2></div><a class="text-link" href="#">SKATĪT VISU <span>↗</span></a></div><div class="category-grid">${categories.map(([n, name, icon]) => `<a class="category" href="#"><span class="category-number">${n}</span><span class="category-icon">${icon}</span><strong>${name}</strong><span class="arrow">↗</span></a>`).join('')}</div></section>

    <section class="product-section" id="new"><div class="section-top"><div><div class="section-kicker">03 / JAUNUMI NOLIKTAVĀ</div><h2>Pēdējie <em>atradumi.</em></h2></div><a class="text-link" href="#">SKATĪT VISUS <span>↗</span></a></div><div class="product-grid" id="product-grid">${products.map((product, index) => `<article class="product-card" data-name="${product.name.toLowerCase()} ${product.code.toLowerCase()}"><div class="product-image"><img src="${product.image}" alt="${product.name}"/><span class="product-tag">${product.tag}</span><button class="quick-add" data-index="${index}" aria-label="Pievienot grozam">+</button></div><div class="product-meta"><span>${product.type}</span><small>${product.code}</small></div><h3>${product.name}</h3><div class="product-bottom"><strong>${product.price},00 €</strong><button class="add-text" data-index="${index}">PIEVIENOT <span>↗</span></button></div></article>`).join('')}</div><p class="no-results" id="no-results">Neviena detaļa neatbilst meklējumam.</p></section>

    <section class="listings-section" id="listings"><div class="section-top"><div><div class="section-kicker">04 / KOPIENAS SLUDINĀJUMI</div><h2>Ko pārdod<br><em>citi.</em></h2></div><a class="text-link" href="#sell">PĀRDOT SAVU DETAĻU <span>↗</span></a></div><div class="listing-table" id="listing-table"><div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div><p class="listing-loading">Ielādējam sludinājumus...</p></div></section>

    <section class="trust-section"><div><span class="trust-icon">✦</span><strong>Pārbaudīta kvalitāte</strong><p>Katra detaļa tiek apskatīta pirms nosūtīšanas.</p></div><div><span class="trust-icon">↝</span><strong>Piegāde Eiropā</strong><p>No mūsu noliktavas Rīgā līdz tavām durvīm.</p></div><div><span class="trust-icon">◷</span><strong>Atbalsts 7 dienas</strong><p>Zini, ko pērc. Mēs palīdzēsim atrast pareizo.</p></div></section>
  </main>
  <footer id="contact"><div class="footer-brand"><a class="brand" href="#"><img src="image-removebg-preview.png" alt="TrackParts LV logo"></a><p>Auto detaļas bez liekām<br>rūpēm.</p></div><div class="footer-column"><b>VEIKALS</b><a href="#catalog">Jaunas detaļas</a><a href="#catalog">Lietotas detaļas</a><a href="#catalog">Kategorijas</a></div><div class="footer-column"><b>PALĪDZĪBA</b><a href="#">Piegāde</a><a href="#">Atgriešana</a><a href="#">Kontakti</a></div><div class="footer-contact"><b>RUNĀSIM</b><a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a><a href="tel:+37120000000">+371 2000 0000</a><p>Rīga, Latvija</p></div><div class="footer-bottom"><span>© 2024 TRACKPARTS</span><span>LV <small>/ EN</small></span><span>INSTAGRAM ↗</span></div></footer>
`

let cartCount = 0
const cartCountElement = document.querySelector('#cart-count')
const homeMarkup = document.querySelector('main').innerHTML

function productMarkup() {
  return `<div class="product-grid">${products.map((product, index) => `<article class="product-card" data-name="${product.name.toLowerCase()} ${product.code.toLowerCase()}"><div class="product-image"><img src="${product.image}" alt="${product.name}"/><span class="product-tag">${product.tag}</span><button class="quick-add" data-index="${index}" aria-label="Pievienot grozam">+</button></div><div class="product-meta"><span>${product.type}</span><small>${product.code}</small></div><h3>${product.name}</h3><div class="product-bottom"><strong>${product.price},00 €</strong><button class="add-text" data-index="${index}">PIEVIENOT <span>↗</span></button></div></article>`).join('')}</div>`
}

function bindProductButtons() {
  document.querySelectorAll('[data-index]').forEach((button) => button.addEventListener('click', () => {
    cartCount += 1
    cartCountElement.textContent = cartCount
    button.textContent = '✓'
    setTimeout(() => { button.textContent = button.classList.contains('quick-add') ? '+' : 'PIEVIENOT ↗' }, 900)
  }))
}

function renderPage() {
  const route = window.location.hash.slice(1) || 'home'
  const pages = {
    catalog: `<section class="page-hero"><div class="section-kicker">02 / PREČU KATALOGS</div><h1>Atrodi detaļu.<br><em>Uztaisi ātrāku.</em></h1><p>Oriģinālas un pārbaudītas detaļas ielas auto, trases projektam un servisam.</p></section><section class="product-section catalog-page"><div class="section-top"><div><div class="section-kicker">VISAS DETAĻAS</div><h2>Noliktavā <em>tagad.</em></h2></div><span class="catalog-count">${products.length} PRECES</span></div>${productMarkup()}</section>`,
    about: `<section class="page-hero about-hero"><div class="section-kicker">03 / PAR TRACKPARTS</div><h1>Built for the<br><em>road ahead.</em></h1><p>Mēs atrodam labas detaļas cilvēkiem, kuri paši zina, cik svarīgs ir katrs pagrieziens.</p></section><section class="story-section"><div class="section-kicker">MŪSU PIEEJA</div><h2>Nevis detaļu kaudze.<br><em>Īstais atradums.</em></h2><div class="story-grid"><p>TrackParts sākās Rīgā ar vienu vienkāršu ideju: lietotai detaļai nav jābūt kompromisam. Katra detaļa tiek pārbaudīta, nofotografēta un marķēta, lai tu vari pirkt ar pārliecību.</p><p>Mūsu noliktavā katram kodam ir sava vieta, statuss un vēsture. Mazāk minēšanas, vairāk laika uz ceļa.</p></div></section><section class="trust-section"><div><span class="trust-icon">✦</span><strong>Pārbaudīta kvalitāte</strong><p>Katrs produkts tiek apskatīts pirms pārdošanas.</p></div><div><span class="trust-icon">↝</span><strong>Piegāde Eiropā</strong><p>No Rīgas līdz tavām durvīm.</p></div><div><span class="trust-icon">◷</span><strong>Cilvēcīgs atbalsts</strong><p>Palīdzēsim atrast pareizo detaļu.</p></div></section>`,
    contact: `<section class="page-hero contact-hero"><div class="section-kicker">04 / SAZINĀSIMIES</div><h1>Ir jautājums?<br><em>Dod ziņu.</em></h1><p>Neatrodi detaļu katalogā? Atsūti VIN, OEM kodu vai bildi, un mēs paskatīsimies.</p></section><section class="contact-section"><div><div class="section-kicker">RAKSTI MUMS</div><h2>Atbildēsim<br><em>ātri.</em></h2></div><div class="contact-list"><a href="mailto:hello@trackparts.lv"><small>E-PASTS</small>hello@trackparts.lv ↗</a><a href="tel:+37120000000"><small>TELEFONS</small>+371 2000 0000 ↗</a><div><small>ATRODI MŪS</small>Rīga, Latvija</div></div></section>`,
    account: `<section class="page-hero"><div class="section-kicker">05 / TAVS KONTS</div><h1>Pieslēdzies.<br><em>Pārdod.</em></h1><p>Izveido kontu, lai ievietotu detaļas un pārvaldītu savus sludinājumus.</p></section><section class="form-section"><form class="site-form" id="auth-form"><div class="section-kicker">LIETOTĀJA PIEKĻUVE</div><h2>Ienākt vai <em>reģistrēties.</em></h2><label>E-PASTS<input type="email" name="email" required placeholder="tavs@epasts.lv"></label><label>PAROLE<input type="password" name="password" required minlength="6" placeholder="Vismaz 6 simboli"></label><div class="form-actions"><button class="button button-dark" type="submit">IELOGOTIES ↗</button><button class="text-button" id="signup-button" type="button">IZVEIDOT KONTU</button></div><p class="form-message" id="auth-message"></p></form></section>`,
    sell: `<section class="page-hero"><div class="section-kicker">06 / JAUNS SLUDINĀJUMS</div><h1>Ieliec detaļu<br><em>uz ceļa.</em></h1><p>Aizpildi informāciju, pievieno bildes un sasniedz cilvēku, kuram tā vajadzīga.</p></section><section class="form-section"><form class="site-form listing-form" id="listing-form"><div class="section-kicker">DETAĻAS INFORMĀCIJA</div><h2>Ko tu <em>pārdod?</em></h2><label>NOSAUKUMS<input name="title" required placeholder="Piem., BMW E46 priekšējais lukturis"></label><div class="form-two"><label>CENA (€)<input name="price" type="number" min="0" step="0.01" required placeholder="250"></label><label>OEM NUMURS<input name="oem_number" placeholder="63117203298"></label></div><div class="form-two"><label>MARKA<input name="brand" placeholder="BMW"></label><label>MODELIS<input name="model" placeholder="E46"></label></div><div class="form-two"><label>GADS<input name="production_year" type="number" min="1950" max="2030" placeholder="2014"></label><label>DZINĒJS<input name="engine" placeholder="530d / 3.0 TDI"></label></div><div class="form-two"><label>KATEGORIJA<select name="category"><option>Virsbūve</option><option>Dzinējs</option><option>Salons</option><option>Balstiekārta</option><option>Elektrība</option></select></label><label>ATRAŠANĀS VIETA<input name="location" placeholder="Rīga, noliktava B3"></label></div><label>STĀVOKLIS<select name="condition"><option value="very_good">Ļoti labs</option><option value="good">Labs</option><option value="defect">Ar defektu</option></select></label><label>APRAKSTS<textarea name="description" rows="5" placeholder="Apraksti detaļas stāvokli un zināmos defektus"></textarea></label><label>BILDES<input name="images" type="file" accept="image/*" multiple required></label><div class="form-actions"><button class="button button-dark" type="submit">PUBLICĒT SLUDINĀJUMU ↗</button></div><p class="form-message" id="listing-message"></p></form></section>`,
  }
  document.querySelector('main').innerHTML = route === 'home' ? homeMarkup : (route === 'listings' ? listingsPage : (pages[route] || pages.catalog))
  document.querySelectorAll('.main-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${route}`))
  bindProductButtons()
  bindRouteForms(route)
  loadListings()
  const form = document.querySelector('#search-form')
  if (form) form.addEventListener('submit', (event) => {
    event.preventDefault()
    const query = document.querySelector('#search-input').value.trim().toLowerCase()
    let visible = 0
    document.querySelectorAll('.product-card').forEach((card) => { const matches = !query || card.dataset.name.includes(query); card.hidden = !matches; if (matches) visible += 1 })
    document.querySelector('#no-results').style.display = visible ? 'none' : 'block'
  })
}

const fallbackListings = [
  { title: 'BMW E90 priekšējais bamperis M-pack', brand: 'BMW', model: 'E90', condition: 'Ļoti labs', price: 180, location: 'Rīga' },
  { title: 'Audi A6 C7 3.0 TDI dzinējs', brand: 'Audi', model: 'A6 C7', condition: 'Pārbaudīts', price: 950, location: 'Jelgava' },
  { title: 'VW Golf 7 GTI priekšējie sēdekļi', brand: 'Volkswagen', model: 'Golf 7', condition: 'Labs', price: 320, location: 'Rīga' },
]

const listingsPage = `<section class="page-hero"><div class="section-kicker">04 / KOPIENAS TIRGUS</div><h1>Redzi, ko citi<br><em>pārdod.</em></h1><p>Īstas detaļas no TrackParts kopienas. Meklē pēc auto, OEM koda vai atrašanās vietas.</p></section><section class="listings-section listings-page"><div class="section-top"><div><div class="section-kicker">AKTĪVIE SLUDINĀJUMI</div><h2>Jaunākie <em>sludinājumi.</em></h2></div><a class="button button-dark" href="#sell">PĀRDOT DETAĻU ↗</a></div><div class="listing-table" id="listing-table"><div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div><p class="listing-loading">Ielādējam sludinājumus...</p></div></section>`

async function loadListings() {
  const targets = document.querySelectorAll('#listing-table')
  if (!targets.length) return
  let rows = fallbackListings
  if (supabase) {
    const { data } = await supabase.from('listings').select('title, brand, model, condition, price, location').eq('status', 'active').order('created_at', { ascending: false }).limit(8)
    if (data?.length) rows = data
  }
  const conditionNames = { very_good: 'Ļoti labs', good: 'Labs', defect: 'Ar defektu' }
  targets.forEach((target) => {
    target.innerHTML = `<div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div>${rows.map((row) => `<a class="listing-row" href="#catalog"><strong>${row.title}</strong><span>${row.brand || '-'} ${row.model || ''}</span><span>${conditionNames[row.condition] || row.condition || 'Nav norādīts'}</span><b>${Number(row.price).toFixed(2).replace('.', ',')} €</b><span class="listing-arrow">↗</span></a>`).join('')}`
  })
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
      if (!error) window.location.hash = 'sell'
    })
    document.querySelector('#signup-button').addEventListener('click', async () => {
      const data = new FormData(authForm)
      if (!data.get('email') || !data.get('password')) { authMessage.textContent = 'Ievadi e-pastu un paroli, lai izveidotu kontu.'; return }
      const { error } = await supabase.auth.signUp({ email: data.get('email'), password: data.get('password') })
      authMessage.textContent = error ? error.message : 'Konts izveidots. Pārbaudi savu e-pastu.'
    })
  }

  const listingForm = document.querySelector('#listing-form')
  if (listingForm) listingForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector('#listing-message')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { message.textContent = 'Lai ievietotu sludinājumu, vispirms ielogojies.'; window.location.hash = 'account'; return }
    const formData = new FormData(listingForm)
    const { data: listing, error } = await supabase.from('listings').insert({ user_id: user.id, title: formData.get('title'), price: Number(formData.get('price')), oem_number: formData.get('oem_number'), brand: formData.get('brand'), model: formData.get('model'), production_year: Number(formData.get('production_year')) || null, engine: formData.get('engine'), location: formData.get('location'), condition: formData.get('condition'), description: formData.get('description'), status: 'pending' }).select().single()
    if (error) { message.textContent = error.message; return }
    const files = [...formData.getAll('images')].filter((file) => file.size)
    for (const [index, file] of files.entries()) {
      const path = `${user.id}/${listing.id}/${Date.now()}-${file.name}`
      const upload = await supabase.storage.from('listing-images').upload(path, file)
      if (!upload.error) await supabase.from('listing_images').insert({ listing_id: listing.id, storage_path: path, sort_order: index })
    }
    message.textContent = 'Sludinājums nosūtīts moderācijai.'
    listingForm.reset()
  })
  if (route === 'sell') supabase.auth.getUser().then(({ data: { user } }) => { if (!user) document.querySelector('#listing-message').textContent = 'Ielogojies, lai publicētu sludinājumu.' })
}

window.addEventListener('hashchange', renderPage)
renderPage()
