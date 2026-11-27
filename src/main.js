import './style.css'
import { supabase } from './lib/supabase.js'
import { CATEGORIES, ROUTE_TITLES, ROUTE_TITLES_EN, loadProducts } from './data.js'
import { honeypotFieldMarkup, trapFocus } from './utils.js'
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
  bindAuthModal,
  cancelMfaModal,
  closeAuthModal,
  getPendingAuthEvent,
  initAccountPage,
  openAuthModal,
  setPendingAuthEvent,
} from './auth.js'
import { adminPage, bindAdminPage, closeAdminDrawer } from './admin.js'
import { STATIC_PAGES, catalogPageMarkup, homeMarkup, notFoundMarkup } from './pages.js'
import { bindHeroFx, initGlobalFx } from './fx.js'
import { closeOpenSelect, enhanceSelects } from './selects.js'

if (window.location.hash.includes('error=') || window.location.hash.includes('error_description=')) {
  window.location.hash = 'account'
}

let isSignedIn = false
let postLoginRedirect = null

function syncAuthNav(signedIn) {
  isSignedIn = Boolean(signedIn)
  document.querySelectorAll('.nav-account-link').forEach((el) => {
    el.hidden = !isSignedIn
  })
  document.querySelectorAll('.auth-login-trigger').forEach((el) => {
    el.hidden = isSignedIn
  })
  document.querySelectorAll('.user-button').forEach((el) => {
    el.hidden = !isSignedIn
  })
}

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    syncAuthNav(Boolean(session?.user))
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
    else if (event === 'SIGNED_OUT') {
      switchCartOwner(null)
      if ((window.location.hash.slice(1) || 'home') === 'account') {
        window.location.hash = 'home'
      }
    }
  })
}

const currentYear = new Date().getFullYear()

document.querySelector('#app').innerHTML = `
  <div class="page-wipe" id="page-wipe"></div>
  <div class="scroll-progress-wrap" aria-hidden="true"><div class="scroll-progress" id="scroll-progress"></div></div>
  <div class="toast-host" id="toast-host"></div>
  <header class="site-header">
    <button class="icon-button menu-toggle" id="menu-toggle" type="button" aria-label="Izvēlne" aria-expanded="false">☰</button>
    <a class="brand" href="#home"><img src="${import.meta.env.BASE_URL}trackapart-logo.png" alt="TrackApart LV logo"></a>
    <nav class="main-nav" aria-label="Galvenā navigācija">
      <a class="active" href="#home">Sākums</a>
      <a href="#catalog" id="catalog-nav-trigger" aria-haspopup="true" aria-expanded="false">Katalogs <span class="nav-caret">▾</span></a>
      <a href="#listings">Sludinājumi</a>
      <a href="#sell">Pārdot detaļu</a>
      <a href="#about">Par mums</a>
      <a href="#account" class="nav-account-link" hidden>Mans konts</a>
      <a href="#contact">Kontakti</a>
    </nav>
    <div class="header-actions">
      <button class="lang" type="button">LV <small>/ EN</small></button>
      <button class="icon-button search-trigger" type="button" aria-label="Meklēt">⌕</button>
      <button class="header-login-btn auth-login-trigger" type="button">IELOGOTIES</button>
      <button class="icon-button user-button" type="button" aria-label="Mans konts" hidden>◎</button>
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
      <a href="#account" class="nav-account-link" hidden>Mans konts</a>
      <a href="#contact">Kontakti</a>
    </nav>
    <button class="mobile-nav-login auth-login-trigger" type="button">IELOGOTIES ↗</button>
    <nav class="mobile-nav-legal">
      <a href="#terms">Lietošanas noteikumi</a>
      <a href="#privacy">Privātuma politika</a>
      <a href="#marketplace">Tirdzniecības noteikumi</a>
      <a href="#safety">Drošība</a>
    </nav>
    <button class="mobile-nav-lang lang" type="button">LV <small>/ EN</small></button>
  </aside>

  <div class="cart-backdrop" id="cart-backdrop"></div>
  <aside class="cart-panel" id="cart-panel" role="dialog" aria-modal="true" aria-label="Grozs">
    <button class="cart-close" type="button" aria-label="Aizvērt grozu">×</button>
    <div id="cart-view">
      <div class="section-kicker">TAVS GROZS</div>
      <h2>Atlasītās <em>detaļas.</em></h2>
      <div class="cart-items" id="cart-items"><p id="cart-empty">Grozs ir tukšs.</p></div>
      <div class="cart-summary"><span>KOPĀ</span><strong id="cart-total">0,00 €</strong></div>
      <button class="button button-accent" type="button" id="checkout-button">UZ NORĒĶINU <span>↗</span></button>
      <button class="text-button cart-clear-btn" type="button" id="clear-cart">NOTĪRĪT GROZU</button>
    </div>
    <div id="checkout-view" hidden></div>
  </aside>

  <div class="modal-overlay" id="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" hidden>
    <div class="auth-modal">
      <button class="modal-close" id="auth-modal-close" type="button" aria-label="Aizvērt">×</button>
      <div class="auth-modal-brand">
        <img src="${import.meta.env.BASE_URL}trackapart-logo.png" alt="TrackApart LV">
      </div>
      <h2 class="auth-modal-title" id="auth-modal-title">Ielogojies <em>TrackApart.</em></h2>
      <p class="auth-modal-subtitle" id="auth-modal-subtitle">Pieslēdzies, lai piekļūtu savam kontam, sludinājumiem un favorītiem.</p>
      <form class="site-form auth-popup-form" id="auth-modal-form" data-mode="login">
        ${honeypotFieldMarkup()}
        <label>E-PASTS<input type="email" name="email" required autocomplete="email" placeholder="tavs@epasts.lv"></label>
        <label>PAROLE<input type="password" name="password" required minlength="6" autocomplete="current-password" placeholder="Vismaz 6 simboli"></label>
        <button class="text-button auth-forgot-link" id="auth-modal-forgot" type="button">Aizmirsi paroli?</button>
        <label class="consent-label" id="auth-modal-consent-row" hidden>
          <input type="checkbox" name="consent">
          <span>Piekrītu <a href="#terms">Lietošanas noteikumiem</a> un <a href="#privacy">Privātuma politikai</a>.</span>
        </label>
        <button class="button button-accent auth-popup-submit" type="submit" id="auth-modal-submit">IELOGOTIES ↗</button>
        <p class="form-message" id="auth-modal-message"></p>
      </form>
      <div class="auth-modal-switch" id="auth-modal-switch">
        <span id="auth-modal-switch-text">Vēl nav konta?</span>
        <button class="text-button" id="auth-modal-switch-btn" type="button">Reģistrēties</button>
      </div>
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
      <a class="brand" href="#home"><img src="${import.meta.env.BASE_URL}trackapart-logo.png" alt="TrackApart LV logo"></a>
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
      <a href="mailto:hello@trackapart.lv">hello@trackapart.lv</a>
      <a href="tel:+37120000000">+371 2000 0000</a>
      <p>Rīga, Latvija</p>
    </div>
    <div class="footer-bottom">
      <span>© ${currentYear} TRACKAPART</span>
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
document.querySelectorAll('.auth-login-trigger').forEach((btn) =>
  btn.addEventListener('click', () => {
    postLoginRedirect = null
    closeMobileNav()
    closeMegaMenu()
    openAuthModal('login')
  }),
)
document.querySelector('.user-button').addEventListener('click', async () => {
  if (!supabase) {
    openAuthModal('login')
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
document.querySelectorAll('.main-nav a:not(#catalog-nav-trigger), .brand').forEach((link) =>
  link.addEventListener('click', closeMegaMenu),
)
window.addEventListener('resize', () => {
  if (window.innerWidth <= 960) closeMegaMenu()
})

// Global Escape closes the topmost open modal/drawer cleanly, and Tab stays trapped inside it.
function getTopOpenDialog() {
  const lightbox = document.querySelector('#lightbox-overlay')
  if (lightbox && !lightbox.hidden) return lightbox
  const mfa = document.querySelector('#mfa-modal-overlay')
  if (mfa && !mfa.hidden) return mfa
  const auth = document.querySelector('#auth-modal-overlay')
  if (auth && !auth.hidden) return auth
  const adminDrawer = document.querySelector('#admin-drawer')
  if (adminDrawer?.classList.contains('is-open')) return adminDrawer
  const cart = document.querySelector('#cart-panel')
  if (cart?.classList.contains('is-open')) return cart
  const mobile = document.querySelector('#mobile-nav')
  if (mobile?.classList.contains('is-open')) return mobile
  return null
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    const dialog = getTopOpenDialog()
    if (dialog) trapFocus(dialog, event)
    return
  }
  if (event.key !== 'Escape') return
  if (closeOpenSelect({ restoreFocus: true })) return
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
  if (document.querySelector('#admin-drawer')?.classList.contains('is-open')) {
    closeAdminDrawer()
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
bindAuthModal(() => {
  syncAuthNav(true)
  if (postLoginRedirect) {
    const target = postLoginRedirect
    postLoginRedirect = null
    if (window.location.hash !== `#${target}`) {
      window.location.hash = target
      return
    }
  }
  renderPage()
})

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
  return STATIC_PAGES[route] || notFoundMarkup(route)
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
  const matchedCategory = route.startsWith('category-')
    ? CATEGORIES.find((c) => c[3] === route.replace('category-', '').replaceAll('-', ' '))
    : null
  document.title =
    titleMap[route] ||
    (route.startsWith('category-')
      ? `${matchedCategory?.[1] || route.replace('category-', '').replaceAll('-', ' ')} — TrackApart`
      : route.startsWith('listing-') || route.startsWith('product-') || route.startsWith('seller-')
        ? titleMap.home
        : titleMap.notFound)

  bindProductButtons()
  bindSellForm(route, openAuthModal)
  bindCatalogFilters()
  bindCatalogSidebarFilters()
  bindCategorySearch()
  loadListings()

  if (route.startsWith('category-')) loadCategoryListings(route.replace('category-', '').replaceAll('-', ' '))
  if (route.startsWith('listing-')) loadListingDetail(route.replace('listing-', ''), openAuthModal)
  if (route.startsWith('product-')) loadProductDetail(route.replace('product-', ''))
  if (route.startsWith('seller-')) loadSellerProfile(route.replace('seller-', ''), openAuthModal)
  if (route === 'admin') bindAdminPage()
  if (route === 'account') {
    initAccountPage({
      onSignOut: () => {
        syncAuthNav(false)
        renderPage({ scrollToTop: true })
      },
      onUnauthenticated: () => {
        syncAuthNav(false)
        postLoginRedirect = 'account'
        window.location.hash = 'home'
        setTimeout(() => openAuthModal('login'), 50)
      },
    })
  }

  if (isEnglish()) {
    translatePage()
    primeAndTranslate()
  }
  enhanceSelects()
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
window.addEventListener('hashchange', () => {
  closeOpenSelect()
  closeMegaMenu()
  closeAdminDrawer()
  playPageWipe(() => renderPage({ scrollToTop: true }))
})
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
  syncAuthNav(Boolean(owner))
  await loadCartForOwner(owner)
  const route = window.location.hash.slice(1) || 'home'
  if (route === 'account' && !owner && getPendingAuthEvent() !== 'recovery') {
    postLoginRedirect = 'account'
    window.location.hash = 'home'
    setTimeout(() => openAuthModal('login'), 50)
    return
  }
  if (!window.location.hash.includes('access_token') && isProductDependentRoute(route) && !userIsEditingFormInMain()) {
    renderPage()
  }
})
