import './style.css'

const products = [
  { name: 'BMW F10 priekšējais kreisais lukturis', type: 'Lietota detaļa', price: 249, code: 'USED-BMW-F10-00152', image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=85', tag: 'Ļoti labs' },
  { name: 'BMW E46 M3 aizmugurējais tilts', type: 'Lietota detaļa', price: 390, code: 'USED-BMW-E46-00881', image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=900&q=85', tag: 'Pēdējais gabals' },
  { name: 'Audi A4 B8 2.0 TDI turbīna', type: 'Lietota detaļa', price: 185, code: 'USED-AUD-B8-00304', image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=85', tag: 'Pārbaudīta' },
  { name: 'Mercedes-Benz W204 AMG bremžu suports', type: 'Lietota detaļa', price: 129, code: 'USED-MER-W204-00027', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=85', tag: 'Ļoti labs' },
]

const categories = [
  ['01', 'Dzinējs', '⚙'], ['02', 'Virsbūve', '◒'], ['03', 'Salons', '▣'], ['04', 'Balstiekārta', '◈'], ['05', 'Elektrība', 'ϟ'], ['06', 'Riteņi & diski', '◉'],
]

document.querySelector('#app').innerHTML = `
  <div class="announcement">KVALITĀTES LIETOTAS DETAĻAS · PIEGĀDE VISĀ EIROPĀ <span>BEZMAKSAS PIEGĀDE NO 150 €</span></div>
  <header class="site-header">
    <a class="brand" href="#"><span>TP</span><strong>TRACK<span>PARTS</span></strong></a>
    <nav class="main-nav"><a class="active" href="#home">Sākums</a><a href="#catalog">Katalogs</a><a href="#about">Par mums</a><a href="#contact">Kontakti</a></nav>
    <div class="header-actions"><button class="lang" type="button">LV <small>/ EN</small></button><button class="icon-button" aria-label="Meklēt">⌕</button><button class="icon-button user-button" aria-label="Mans konts">◎</button><button class="cart-button" type="button" aria-label="Grozs">GROZS <b id="cart-count">0</b></button></div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy"><p class="eyebrow">DETĀĻAS, KURĀM VAR UZTICĒTIES</p><h1>Tava automašīna.<br><em>Mūsu detaļas.</em></h1><p class="hero-text">Pārbaudītas lietotas auto detaļas. Atrastas ātri, nosūtītas droši.</p><a class="button button-light" href="#catalog">SKATĪT KATALOGU <span>↗</span></a></div>
      <div class="hero-visual"><div class="hero-label">EST. 2024 <i></i> RĪGA, LV</div><div class="hero-wheel"></div><div class="hero-spec">01 <span>TRACKPARTS</span></div></div>
      <div class="hero-stats"><div><strong>10k+</strong><span>DETAĻAS<br>NOLIKTAVĀ</span></div><div><strong>24h</strong><span>ĀTRA<br>IZSŪTĪŠANA</span></div></div>
    </section>

    <section class="search-section" id="catalog"><div class="section-kicker">01 / ATRODI SAVU DETAĻU</div><div class="search-heading"><h2>Ko tu meklē?</h2><p>Meklē pēc nosaukuma, OEM koda vai detaļas numura.</p></div><form class="search-box" id="search-form"><span>⌕</span><input id="search-input" placeholder="Piem., BMW F10 lukturis vai 63117203298"/><button type="submit">MEKLĒT <b>↗</b></button></form><div class="select-row"><label>MARKA<select><option>Visas markas</option><option>BMW</option><option>Audi</option><option>Mercedes-Benz</option></select></label><label>MODELIS<select><option>Visi modeļi</option><option>F10</option><option>E46</option><option>A4 B8</option></select></label><label>DETAĻAS TIPS<select><option>Visas kategorijas</option><option>Motora detaļas</option><option>Virsbūve</option><option>Salons</option></select></label><button class="filter-button" type="button">+ VAIRĀK FILTRU</button></div></section>

    <section class="category-section"><div class="section-top"><div><div class="section-kicker">02 / IZPĒTI KATEGORIJAS</div><h2>Viss, kas vajadzīgs<br><em>tavam auto.</em></h2></div><a class="text-link" href="#">SKATĪT VISU <span>↗</span></a></div><div class="category-grid">${categories.map(([n, name, icon]) => `<a class="category" href="#"><span class="category-number">${n}</span><span class="category-icon">${icon}</span><strong>${name}</strong><span class="arrow">↗</span></a>`).join('')}</div></section>

    <section class="product-section" id="new"><div class="section-top"><div><div class="section-kicker">03 / JAUNUMI NOLIKTAVĀ</div><h2>Pēdējie <em>atradumi.</em></h2></div><a class="text-link" href="#">SKATĪT VISUS <span>↗</span></a></div><div class="product-grid" id="product-grid">${products.map((product, index) => `<article class="product-card" data-name="${product.name.toLowerCase()} ${product.code.toLowerCase()}"><div class="product-image"><img src="${product.image}" alt="${product.name}"/><span class="product-tag">${product.tag}</span><button class="quick-add" data-index="${index}" aria-label="Pievienot grozam">+</button></div><div class="product-meta"><span>${product.type}</span><small>${product.code}</small></div><h3>${product.name}</h3><div class="product-bottom"><strong>${product.price},00 €</strong><button class="add-text" data-index="${index}">PIEVIENOT <span>↗</span></button></div></article>`).join('')}</div><p class="no-results" id="no-results">Neviena detaļa neatbilst meklējumam.</p></section>

    <section class="trust-section"><div><span class="trust-icon">✦</span><strong>Pārbaudīta kvalitāte</strong><p>Katra detaļa tiek apskatīta pirms nosūtīšanas.</p></div><div><span class="trust-icon">↝</span><strong>Piegāde Eiropā</strong><p>No mūsu noliktavas Rīgā līdz tavām durvīm.</p></div><div><span class="trust-icon">◷</span><strong>Atbalsts 7 dienas</strong><p>Zini, ko pērc. Mēs palīdzēsim atrast pareizo.</p></div></section>
  </main>
  <footer id="contact"><div class="footer-brand"><a class="brand" href="#"><span>TP</span><strong>TRACK<span>PARTS</span></strong></a><p>Auto detaļas bez liekām<br>rūpēm.</p></div><div class="footer-column"><b>VEIKALS</b><a href="#catalog">Jaunas detaļas</a><a href="#catalog">Lietotas detaļas</a><a href="#catalog">Kategorijas</a></div><div class="footer-column"><b>PALĪDZĪBA</b><a href="#">Piegāde</a><a href="#">Atgriešana</a><a href="#">Kontakti</a></div><div class="footer-contact"><b>RUNĀSIM</b><a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a><a href="tel:+37120000000">+371 2000 0000</a><p>Rīga, Latvija</p></div><div class="footer-bottom"><span>© 2024 TRACKPARTS</span><span>LV <small>/ EN</small></span><span>INSTAGRAM ↗</span></div></footer>
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
  }
  document.querySelector('main').innerHTML = route === 'home' ? homeMarkup : (pages[route] || pages.catalog)
  document.querySelectorAll('.main-nav a').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${route}`))
  bindProductButtons()
  const form = document.querySelector('#search-form')
  if (form) form.addEventListener('submit', (event) => {
    event.preventDefault()
    const query = document.querySelector('#search-input').value.trim().toLowerCase()
    let visible = 0
    document.querySelectorAll('.product-card').forEach((card) => { const matches = !query || card.dataset.name.includes(query); card.hidden = !matches; if (matches) visible += 1 })
    document.querySelector('#no-results').style.display = visible ? 'none' : 'block'
  })
}

window.addEventListener('hashchange', renderPage)
renderPage()
