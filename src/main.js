import './style.css'
import { supabase } from './lib/supabase.js'
import { CATEGORIES, ROUTE_TITLES, ROUTE_TITLES_EN, loadProducts } from './data.js'
import { honeypotFieldMarkup } from './utils.js'
import {
  initLanguage,
  isEnglish,
  primeAndTranslate,
  syncDocumentLanguage,
  toggleLanguage,
  translatePage,
} from './i18n.js'
import { bindCartControls, closeCartPanel, loadCartForOwner, switchCartOwner } from './cart.js'
import {
  bindCatalogFilters,
  bindCatalogSidebarFilters,
  bindCategorySearch,
  bindLightbox,
  bindProductButtons,
  categoryPage,
  closeLightbox,
  loadProductDetail,
  productDetailPage,
} from './catalog.js'
import {
  bindSellForm,
  listingDetailPage,
  listingsPage,
  loadCategoryListings,
  loadListingDetail,
  loadListings,
  loadSellerProfile,
  sellerProfilePage,
} from './listings.js'
import {
  bindAccountAuthForm,
  bindAuthModal,
  cancelMfaModal,
  closeAuthModal,
  initAccountPage,
  openAuthModal,
  setPendingAuthEvent,
} from './auth.js'
import { adminPage, bindAdminPage } from './admin.js'
import { STATIC_PAGES, catalogPageMarkup, homeMarkup } from './pages.js'
import { bindHeroFx, initGlobalFx } from './fx.js'

if (window.location.hash.includes('error=') || window.location.hash.includes('error_description=')) {
  window.location.hash = 'account'
}

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      setPendingAuthEvent('recovery')
      if (window.location.hash !== '#account') window.location.hash = 'account'
      else renderPage()
    } else if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
      setPendingAuthEvent('confirmed')
      if (window.location.hash !== '#account') window.location.hash = 'account'
      else renderPage()
    }
    if (event === 'SIGNED_IN' && session?.user) switchCartOwner(session.user.id)
    else if (event === 'SIGNED_OUT') switchCartOwner(null)
  })
}

const currentYear = new Date().getFullYear()

document.querySelector('#app').innerHTML = `
  <div class="page-wipe" id="page-wipe"></div>
  <div class="scroll-progress-wrap" aria-hidden="true"><div class="scroll-progress" id="scroll-progress"></div></div>
  <div class="toast-host" id="toast-host"></div>
  <header class="site-header">
    <button class="icon-button menu-toggle" id="menu-toggle" type="button" aria-label="Izvēlne" aria-expanded="false">☰</button>
    <a class="brand" href="#home"><img src="${import.meta.env.BASE_URL}image-removebg-preview.png" alt="TrackParts LV logo"></a>
    <nav class="main-nav" aria-label="Galvenā navigācija">
      <a class="active" href="#home">Sākums</a>
      <a href="#catalog" id="catalog-nav-trigger" aria-haspopup="true" aria-expanded="false">Katalogs <span class="nav-caret">▾</span></a>
      <a href="#listings">Sludinājumi</a>
      <a href="#sell">Pārdot detaļu</a>
      <a href="#about">Par mums</a>
      <a href="#account">Mans konts</a>
      <a href="#contact">Kontakti</a>
    </nav>
    <div class="header-actions">
      <button class="lang" type="button">LV <small>/ EN</small></button>
      <button class="icon-button search-trigger" type="button" aria-label="Meklēt">⌕</button>
      <button class="icon-button user-button" type="button" aria-label="Mans konts">◎</button>
      <button class="cart-button" type="button" aria-label="Grozs">GROZS <b id="cart-count">0</b></button>
    </div>
  </header>

  <div class="mega-menu-backdrop" id="mega-menu-backdrop"></div>
  <div class="mega-menu" id="mega-menu">
    <div class="mega-menu-top">
      <span class="section-kicker">IZVĒLIES KATEGORIJU</span>
      <a class="text-link" href="#catalog" id="mega-menu-viewall">SKATĪT VISU <span>↗</span></a>
      <button class="mega-menu-close" id="mega-menu-close" type="button" aria-label="Aizvērt">×</button>
    </div>
    <div class="mega-menu-grid">
      ${CATEGORIES.map(
        ([, name, icon, value]) =>
          `<a class="mega-menu-category" href="#category-${value.replaceAll(' ', '-')}"><span class="category-icon">${icon}</span><strong>${name}</strong><span class="arrow">↗</span></a>`,
      ).join('')}
    </div>
  </div>

  <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
  <aside class="mobile-nav" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Izvēlne">
    <button class="mobile-nav-close" id="mobile-nav-close" type="button" aria-label="Aizvērt izvēlni">×</button>
    <nav class="mobile-nav-links">
      <a class="active" href="#home">Sākums</a>
      <a href="#catalog">Katalogs</a>
      <a href="#listings">Sludinājumi</a>
      <a href="#sell">Pārdot detaļu</a>
      <a href="#about">Par mums</a>
      <a href="#account">Mans konts</a>
      <a href="#contact">Kontakti</a>
    </nav>
    <nav class="mobile-nav-legal">
      <a href="#terms">Lietošanas noteikumi</a>
      <a href="#privacy">Privātuma politika</a>
      <a href="#marketplace">Tirdzniecības noteikumi</a>
      <a href="#safety">Drošība</a>
    </nav>
    <button class="mobile-nav-lang lang" type="button">LV <small>/ EN</small></button>
  </aside>

  <aside class="cart-panel" id="cart-panel" role="dialog" aria-modal="true" aria-label="Grozs">
    <button class="cart-close" type="button" aria-label="Aizvērt grozu">×</button>
    <div class="section-kicker">TAVS GROZS</div>
    <h2>Atlasītās <em>detaļas.</em></h2>
    <div id="cart-view">
      <div class="cart-items" id="cart-items"><p id="cart-empty">Grozs ir tukšs.</p></div>
      <div class="cart-summary"><span>KOPĀ</span><strong id="cart-total">0,00 €</strong></div>
      <button class="button button-dark" type="button" id="checkout-button">UZ NORĒĶINU ↗</button>
      <button class="text-button" type="button" id="clear-cart">NOTĪRĪT GROZU</button>
    </div>
    <div id="checkout-view" hidden></div>
  </aside>

  <div class="modal-overlay" id="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" hidden>
    <div class="auth-modal">
      <button class="modal-close" id="auth-modal-close" type="button" aria-label="Aizvērt">×</button>
      <div class="auth-modal-tabs">
        <button class="auth-tab active" data-auth-tab="login" type="button">IELOGOTIES</button>
        <button class="auth-tab" data-auth-tab="signup" type="button">REĢISTRĒTIES</button>
      </div>
      <h2 class="auth-modal-title" id="auth-modal-title">Sveicināts <em>TrackParts.</em></h2>
      <form class="site-form" id="auth-modal-form" data-mode="login">
        ${honeypotFieldMarkup()}
        <label>E-PASTS<input type="email" name="email" required placeholder="tavs@epasts.lv"></label>
        <label>PAROLE<input type="password" name="password" required minlength="6" placeholder="Vismaz 6 simboli"></label>
        <label class="consent-label" id="auth-modal-consent-row" hidden>
          <input type="checkbox" name="consent">
          <span>Piekrītu <a href="#terms">Lietošanas noteikumiem</a> un <a href="#privacy">Privātuma politikai</a>.</span>
        </label>
        <div class="form-actions">
          <button class="button button-dark" type="submit" id="auth-modal-submit">IELOGOTIES ↗</button>
          <button class="text-button" id="auth-modal-forgot" type="button">AIZMIRSI PAROLI?</button>
        </div>
        <p class="form-message" id="auth-modal-message"></p>
      </form>
    </div>
  </div>

  <div class="modal-overlay" id="mfa-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mfa-modal-title" hidden>
    <div class="auth-modal">
      <h2 class="auth-modal-title" id="mfa-modal-title">Ievadi <em>2FA kodu.</em></h2>
      <p>Šim kontam ir ieslēgta divfaktoru autentifikācija. Ievadi kodu no savas autentifikācijas lietotnes.</p>
      <div id="mfa-modal-holder"></div>
      <button class="text-button" id="mfa-modal-cancel" type="button">ATCELT UN IZIET</button>
    </div>
  </div>

  <div class="cookie-notice" id="cookie-notice" hidden>
    <p>Šī vietne izmanto tikai tehniski nepieciešamu lokālo glabātuvi, lai uzturētu tavu pieslēgšanās sesiju. Uzzini vairāk mūsu <a href="#privacy">Privātuma politikā</a>.</p>
    <button class="button button-light" type="button" id="cookie-notice-accept">SAPRATU</button>
  </div>

  <div class="lightbox-overlay" id="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Attēla priekšskatījums" hidden>
    <button class="lightbox-close" id="lightbox-close" type="button" aria-label="Aizvērt">×</button>
    <img id="lightbox-image" src="" alt="">
    <button class="gallery-arrow gallery-prev" id="lightbox-prev" type="button" aria-label="Iepriekšējā bilde">‹</button>
    <button class="gallery-arrow gallery-next" id="lightbox-next" type="button" aria-label="Nākamā bilde">›</button>
  </div>

  <main></main>

  <footer id="site-footer">
    <div class="footer-brand">
      <a class="brand" href="#home"><img src="${import.meta.env.BASE_URL}image-removebg-preview.png" alt="TrackParts LV logo"></a>
      <p>Auto detaļas bez liekām<br>rūpēm.</p>
    </div>
    <div class="footer-column">
      <b>VEIKALS</b>
      <a href="#catalog">Pārbaudītas detaļas</a>
      <a href="#listings">Kopienas sludinājumi</a>
      <a href="#sell">Pārdot detaļu</a>
    </div>
    <div class="footer-column">
      <b>PALĪDZĪBA</b>
      <a href="#about">Par mums</a>
      <a href="#contact">Piegāde</a>
      <a href="#contact">Kontakti</a>
    </div>
    <div class="footer-contact">
      <b>RUNĀSIM</b>
      <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>
      <a href="tel:+37120000000">+371 2000 0000</a>
      <p>Rīga, Latvija</p>
    </div>
    <div class="footer-bottom">
      <span>© ${currentYear} TRACKPARTS</span>
      <nav class="footer-legal">
        <a href="#terms">Lietošanas noteikumi</a>
        <a href="#privacy">Privātuma politika</a>
        <a href="#marketplace">Tirdzniecības noteikumi</a>
        <a href="#safety">Drošība</a>
      </nav>
      <button class="lang footer-lang" type="button">LV <small>/ EN</small></button>
      <a href="https://www.instagram.com" target="_blank" rel="noreferrer">INSTAGRAM ↗</a>
    </div>
  </footer>
`

function closeMobileNav() {
  document.querySelector('#mobile-nav').classList.remove('is-open')
  document.querySelector('#mobile-nav-backdrop').classList.remove('is-open')
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false')
}

function closeMegaMenu() {
  document.querySelector('#mega-menu').classList.remove('is-open')
  document.querySelector('#mega-menu-backdrop').classList.remove('is-open')
  document.querySelector('#catalog-nav-trigger').setAttribute('aria-expanded', 'false')
}

let pendingSearchFocus = false

function focusHomeSearch() {
  const input = document.querySelector('#search-input')
  if (!input) return
  input.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input.focus({ preventScroll: true })
}

document.querySelector('.search-trigger').addEventListener('click', () => {
  const current = window.location.hash.slice(1) || 'home'
  if (current === 'home') {
    focusHomeSearch()
    return
  }
  pendingSearchFocus = true
  window.location.hash = 'home'
})
document.querySelector('.user-button').addEventListener('click', async () => {
  if (!supabase) {
    window.location.hash = 'account'
    return
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) window.location.hash = 'account'
  else openAuthModal('login')
})

document.querySelector('#menu-toggle').addEventListener('click', () => {
  closeMegaMenu()
  const open = document.querySelector('#mobile-nav').classList.toggle('is-open')
  document.querySelector('#mobile-nav-backdrop').classList.toggle('is-open', open)
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', String(open))
})
document.querySelector('#mobile-nav-close').addEventListener('click', closeMobileNav)
document.querySelector('#mobile-nav-backdrop').addEventListener('click', closeMobileNav)
document.querySelectorAll('.mobile-nav-links a, .mobile-nav-legal a').forEach((link) =>
  link.addEventListener('click', closeMobileNav),
)

document.querySelector('#catalog-nav-trigger').addEventListener('click', (event) => {
  event.preventDefault()
  const open = document.querySelector('#mega-menu').classList.toggle('is-open')
  document.querySelector('#mega-menu-backdrop').classList.toggle('is-open', open)
  document.querySelector('#catalog-nav-trigger').setAttribute('aria-expanded', String(open))
})
document.querySelector('#mega-menu-close').addEventListener('click', closeMegaMenu)
document.querySelector('#mega-menu-backdrop').addEventListener('click', closeMegaMenu)
document.querySelectorAll('.mega-menu-category, #mega-menu-viewall').forEach((link) =>
  link.addEventListener('click', closeMegaMenu),
)

// Global Escape closes the topmost open modal/drawer cleanly.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  if (!document.querySelector('#lightbox-overlay')?.hidden) {
    closeLightbox()
    return
  }
  if (!document.querySelector('#auth-modal-overlay')?.hidden) {
    closeAuthModal()
    return
  }
  if (!document.querySelector('#mfa-modal-overlay')?.hidden) {
    cancelMfaModal()
    return
  }
  if (document.querySelector('#cart-panel')?.classList.contains('is-open')) {
    closeCartPanel()
    return
  }
  if (document.querySelector('#mobile-nav')?.classList.contains('is-open')) {
    closeMobileNav()
    return
  }
  closeMegaMenu()
})

try {
  if (!localStorage.getItem('cookieNoticeDismissed')) {
    document.querySelector('#cookie-notice').hidden = false
  }
} catch {
  // localStorage unavailable
}
document.querySelector('#cookie-notice-accept').addEventListener('click', () => {
  document.querySelector('#cookie-notice').hidden = true
  try {
    localStorage.setItem('cookieNoticeDismissed', '1')
  } catch {
    // ignore
  }
})

bindCartControls({ onOpen: closeMegaMenu })
bindLightbox()
bindAuthModal(() => renderPage())

document.querySelectorAll('.lang').forEach((languageButton) =>
  languageButton.addEventListener('click', () => {
    toggleLanguage()
    const rawRoute = window.location.hash.slice(1) || 'home'
    let route = rawRoute
    try {
      route = decodeURIComponent(rawRoute)
    } catch {
      // malformed sequence, keep raw
    }
    syncDocumentLanguage(route)
  }),
)

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
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'))
    return
  }
  const sectionObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        obs.unobserve(entry.target)
      })
    },
    { threshold: 0.15 },
  )
  document.querySelectorAll('main .reveal').forEach((el) => sectionObserver.observe(el))
  const statObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        animateCountUp(entry.target)
        obs.unobserve(entry.target)
      })
    },
    { threshold: 0.6 },
  )
  document.querySelectorAll('.hero-stats strong').forEach((el) => statObserver.observe(el))
}

function resolvePageHtml(route) {
  if (route === 'home') return homeMarkup()
  if (route === 'catalog') return catalogPageMarkup()
  if (route === 'admin') return adminPage
  if (route === 'listings') return listingsPage
  if (route.startsWith('listing-')) return listingDetailPage
  if (route.startsWith('product-')) return productDetailPage
  if (route.startsWith('seller-')) return sellerProfilePage
  if (route.startsWith('category-')) return categoryPage(route.replace('category-', '').replaceAll('-', ' '))
  return STATIC_PAGES[route] || catalogPageMarkup()
}

function renderPage({ scrollToTop = false } = {}) {
  const rawRoute = window.location.hash.slice(1) || 'home'
  let route = rawRoute
  try {
    route = decodeURIComponent(rawRoute)
  } catch {
    // malformed sequence, keep raw
  }

  document.querySelector('main').innerHTML = resolvePageHtml(route)
  if (scrollToTop) window.scrollTo({ top: 0, behavior: 'instant' })

  document
    .querySelectorAll('.main-nav a, .mobile-nav-links a, .mobile-nav-legal a')
    .forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${route}`))

  const titleMap = isEnglish() ? ROUTE_TITLES_EN : ROUTE_TITLES
  document.title =
    titleMap[route] ||
    (route.startsWith('category-')
      ? `${route.replace('category-', '').replaceAll('-', ' ')} — TrackParts`
      : titleMap.home)

  bindProductButtons()
  bindAccountAuthForm(() => renderPage())
  bindSellForm(route, openAuthModal)
  bindCatalogFilters()
  bindCatalogSidebarFilters()
  bindCategorySearch()
  loadListings()

  if (route.startsWith('category-')) loadCategoryListings(route.replace('category-', '').replaceAll('-', ' '))
  if (route.startsWith('listing-')) loadListingDetail(route.replace('listing-', ''), openAuthModal)
  if (route.startsWith('product-')) loadProductDetail(route.replace('product-', ''))
  if (route.startsWith('seller-')) loadSellerProfile(route.replace('seller-', ''))
  if (route === 'admin') bindAdminPage()
  if (route === 'account') initAccountPage(() => renderPage({ scrollToTop: true }))

  if (isEnglish()) {
    translatePage()
    primeAndTranslate()
  }
  bindHeroFx()
  initScrollReveal()

  if (route === 'home' && pendingSearchFocus) {
    pendingSearchFocus = false
    requestAnimationFrame(focusHomeSearch)
  }
}

let activeWipeCleanup = null

function playPageWipe(callback) {
  const wipe = document.querySelector('#page-wipe')
  if (!wipe || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    callback()
    return
  }
  if (activeWipeCleanup) activeWipeCleanup()

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    cleanup()
    callback()
    const main = document.querySelector('main')
    if (main) {
      main.classList.remove('route-fade')
      void main.offsetWidth
      main.classList.add('route-fade')
    }
    wipe.classList.remove('wipe-cover')
  }
  const onCovered = (event) => {
    if (event.propertyName === 'opacity') finish()
  }
  const fallbackTimer = setTimeout(finish, 360)
  const cleanup = () => {
    clearTimeout(fallbackTimer)
    wipe.removeEventListener('transitionend', onCovered)
    activeWipeCleanup = null
  }
  activeWipeCleanup = cleanup

  wipe.addEventListener('transitionend', onCovered)
  wipe.classList.add('wipe-cover')
}

initLanguage()
initGlobalFx()
window.addEventListener('hashchange', () => playPageWipe(() => renderPage({ scrollToTop: true })))
renderPage()

function isProductDependentRoute(route) {
  return (
    route === 'home' ||
    route === 'catalog' ||
    route.startsWith('category-') ||
    route.startsWith('product-')
  )
}

function userIsEditingFormInMain() {
  const active = document.activeElement
  return Boolean(active && active.closest('main') && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))
}

loadProducts().then(async () => {
  const owner = supabase ? (await supabase.auth.getUser()).data.user?.id : null
  await loadCartForOwner(owner)
  const route = window.location.hash.slice(1) || 'home'
  if (!window.location.hash.includes('access_token') && isProductDependentRoute(route) && !userIsEditingFormInMain()) {
    renderPage()
  }
})
