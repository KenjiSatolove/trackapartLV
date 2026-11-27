import { CATEGORIES, getProducts, isProductsLoaded } from './data.js'
import { addToCart, getAvailableStock } from './cart.js'
import {
  buildProductSearchBlob,
  escapeHtml,
  formatPrice,
  matchesProductionYear,
  parseOptionalPrice,
  safeUrl,
  stockLabel,
} from './utils.js'
import { isEnglish, primeAndTranslate, translatePage } from './i18n.js'

export const CATALOG_PAGE_SIZE = 8

export function normalizeConditionLabel(condition) {
  const trimmed = String(condition ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.toLowerCase() === 'pārbaudīta') return 'Pārbaudīts'
  return trimmed
}

export function matchesConditionFilter(productCondition, filterCondition) {
  const filter = String(filterCondition ?? '').trim().toLowerCase()
  if (!filter) return true
  const cond = String(productCondition ?? '').trim().toLowerCase()
  if (!cond) return false
  if (filter === 'pārbaudīt') return cond.startsWith('pārbaudīt')
  return cond === filter
}

export function productCardMarkup(product, index, capped) {
  const dataName = buildProductSearchBlob(product)
  const stock = getAvailableStock(product)
  const outOfStock = stock <= 0
  const imgSrc = escapeHtml(safeUrl(product.image))
  const safeId = escapeHtml(product.id)
  const tagText = outOfStock ? 'NAV NOLIKTAVĀ' : product.tag || product.condition || ''

  return `<article class="product-card${capped ? ' card-capped' : ''}${outOfStock ? ' is-out-of-stock' : ''}" data-product-id="${safeId}" data-name="${escapeHtml(dataName)}" data-year="${escapeHtml(product.production_year || '')}" data-price="${Number(product.price || 0)}" data-category="${escapeHtml((product.category || '').toLowerCase())}" data-brand="${escapeHtml((product.brand || '').toLowerCase())}" data-model="${escapeHtml((product.model || '').toLowerCase())}" data-condition="${escapeHtml((product.condition || '').toLowerCase())}" data-order="${index ?? 0}">
    <div class="product-image">
      <a class="product-card-link product-image-link" href="#product-${safeId}" tabindex="-1" aria-hidden="true">
        ${imgSrc ? `<img src="${imgSrc}" alt="" loading="lazy"/>` : '<div class="gallery-empty">Nav bildes</div>'}
      </a>
      <span class="product-tag${outOfStock ? ' is-soldout' : ''}">${escapeHtml(tagText)}</span>
      <button class="quick-add" data-id="${safeId}" type="button" ${outOfStock ? 'disabled' : ''} aria-label="Pievienot grozam">+</button>
    </div>
    <div class="product-meta">
      <span>${escapeHtml(product.type)}</span>
      <small>${escapeHtml(product.code || '')}</small>
    </div>
    <h3><a class="product-card-link" href="#product-${safeId}">${escapeHtml(product.name)}</a></h3>
    <div class="product-bottom">
      <strong>${formatPrice(product.price)}</strong>
      <button class="add-text" data-id="${safeId}" type="button" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'NAV NOLIKTAVĀ' : 'PIEVIENOT <span>↗</span>'}</button>
    </div>
  </article>`
}

export function productGridMarkup(list, paginate, { showMoreButton = true } = {}) {
  const limit = paginate ? CATALOG_PAGE_SIZE : list.length
  return `<div class="product-grid" id="product-grid">${list
    .map((product, index) => productCardMarkup(product, index, index >= limit))
    .join('')}</div>
    <p class="no-results" id="no-results" ${list.length ? 'hidden' : ''}>Neviena detaļa neatbilst meklējumam.</p>
    ${paginate && showMoreButton && list.length > limit ? '<button class="filter-button show-more-button" id="catalog-show-more" type="button">RĀDĪT VAIRĀK ↓</button>' : ''}`
}

export function searchBoxMarkup() {
  const products = getProducts()
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort()
  const models = [...new Set(products.map((p) => p.model).filter(Boolean))].sort()
  return `<form class="search-box" id="search-form">
      <span aria-hidden="true">⌕</span>
      <input id="search-input" placeholder="Piem., BMW F10 lukturis vai 63117203298"/>
      <button type="submit">MEKLĒT <b>↗</b></button>
    </form>
    <div class="select-row">
      <label>MARKA<select id="filter-brand"><option value="">Visas markas</option>${brands
        .map((b) => `<option value="${escapeHtml(b.toLowerCase())}">${escapeHtml(b)}</option>`)
        .join('')}</select></label>
      <label>MODELIS<select id="filter-model"><option value="">Visi modeļi</option>${models
        .map((m) => `<option value="${escapeHtml(m.toLowerCase())}">${escapeHtml(m)}</option>`)
        .join('')}</select></label>
      <label>DETAĻAS TIPS<select id="filter-category"><option value="">Visas kategorijas</option>${CATEGORIES.map(
        (c) => `<option value="${escapeHtml(c[3])}">${escapeHtml(c[1])}</option>`,
      ).join('')}</select></label>
      <label>KĀRTOT<select id="sort-select"><option value="">Jaunākie</option><option value="price-asc">Cena: no zemākās</option><option value="price-desc">Cena: no augstākās</option></select></label>
      <button class="filter-button" id="more-filters" type="button">+ VAIRĀK FILTRU</button>
    </div>
    <div class="extra-filters" id="extra-filters">
      <label>STĀVOKLIS<select id="filter-condition"><option value="">Jebkurš</option><option value="ļoti labs">Ļoti labs</option><option value="labs">Labs</option><option value="pārbaudīt">Pārbaudīts</option><option value="ar defektu">Ar defektu</option></select></label>
      <label>CENA NO (€)<input id="filter-price-min" type="number" min="0" placeholder="0"></label>
      <label>CENA LĪDZ (€)<input id="filter-price-max" type="number" min="0" placeholder="1000"></label>
      <label>GADS<input id="filter-year" placeholder="Piem., 2012"></label>
    </div>`
}

export function bindCatalogFilters() {
  const form = document.querySelector('#search-form')
  if (!form) return
  const products = getProducts()
  const brandSelect = document.querySelector('#filter-brand')
  const modelSelect = document.querySelector('#filter-model')
  const modelsByBrand = {}
  products.forEach((p) => {
    if (p.brand && p.model) {
      const key = p.brand.toLowerCase()
      ;(modelsByBrand[key] ??= new Set()).add(p.model)
    }
  })
  const allModels = [...new Set(products.map((p) => p.model).filter(Boolean))].sort()

  const refreshModelOptions = () => {
    const brand = brandSelect?.value || ''
    const models = brand ? [...(modelsByBrand[brand] || [])].sort() : allModels
    const current = modelSelect.value
    modelSelect.innerHTML = `<option value="">Visi modeļi</option>${models
      .map((m) => `<option value="${escapeHtml(m.toLowerCase())}">${escapeHtml(m)}</option>`)
      .join('')}`
    if (models.some((m) => m.toLowerCase() === current)) modelSelect.value = current
  }

  const run = () => {
    document.querySelectorAll('.product-card.card-capped').forEach((card) => card.classList.remove('card-capped'))
    document.querySelector('#catalog-show-more')?.remove()
    const query = document.querySelector('#search-input').value.trim().toLowerCase()
    const brand = brandSelect?.value || ''
    const model = modelSelect?.value || ''
    const category = document.querySelector('#filter-category')?.value || ''
    const condition = document.querySelector('#filter-condition')?.value || ''
    const priceMin = parseOptionalPrice(document.querySelector('#filter-price-min')?.value, 0)
    const priceMax = parseOptionalPrice(document.querySelector('#filter-price-max')?.value, Infinity)
    const year = document.querySelector('#filter-year')?.value.trim().toLowerCase() || ''
    let visible = 0
    document.querySelectorAll('.product-card').forEach((card) => {
      const text = card.dataset.name || ''
      const price = Number(card.dataset.price)
      const matches =
        (!query || text.includes(query)) &&
        (!brand || card.dataset.brand === brand) &&
        (!model || card.dataset.model === model) &&
        (!category || card.dataset.category === category) &&
        matchesConditionFilter(card.dataset.condition, condition) &&
        price >= priceMin &&
        price <= priceMax &&
        matchesProductionYear(card.dataset.year, year)
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

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    run()
  })
  document
    .querySelectorAll('#filter-category, #filter-condition, #filter-price-min, #filter-price-max, #filter-year')
    .forEach((el) => el.addEventListener('input', run))
  brandSelect?.addEventListener('change', () => {
    refreshModelOptions()
    run()
  })
  modelSelect?.addEventListener('change', run)
  document.querySelector('#sort-select')?.addEventListener('change', sort)
  document.querySelector('#more-filters')?.addEventListener('click', (event) => {
    const isOpen = document.querySelector('#extra-filters')?.classList.toggle('is-open')
    event.currentTarget.textContent = isOpen ? '- MAZĀK FILTRU' : '+ VAIRĀK FILTRU'
    if (isEnglish()) translatePage()
  })
  // Scoped strictly to .brand-strip buttons so product cards with data-brand aren't matched!
  document.querySelectorAll('.brand-strip [data-brand]').forEach((button) =>
    button.addEventListener('click', () => {
      const targetBrand = button.dataset.brand
      const hasBrandOption =
        brandSelect && [...brandSelect.options].some((option) => option.value === targetBrand)
      if (hasBrandOption) {
        brandSelect.value = targetBrand
        document.querySelector('#search-input').value = ''
      } else {
        if (brandSelect) brandSelect.value = ''
        document.querySelector('#search-input').value = targetBrand
      }
      refreshModelOptions()
      if (modelSelect) modelSelect.value = ''
      run()
      document.querySelector('#product-grid')?.scrollIntoView({ behavior: 'smooth' })
    }),
  )
}

export function sidebarFilterMarkup() {
  return `<div class="sidebar-search"><span aria-hidden="true">⌕</span><input id="sidebar-search-input" placeholder="Meklē..."></div>
    <div class="sidebar-facet"><div class="sidebar-facet-label">MARKA</div><div class="facet-options" id="facet-options-brand"></div></div>
    <div class="sidebar-facet"><div class="sidebar-facet-label">MODELIS</div><div class="facet-search"><span aria-hidden="true">⌕</span><input type="text" placeholder="Meklēt..." id="facet-search-model"></div><div class="facet-options" id="facet-options-model"></div></div>
    <button class="sidebar-facet-toggle" type="button" data-facet-toggle="category">KATEGORIJA<span class="facet-chevron">▾</span></button>
    <div class="sidebar-facet-body" id="facet-body-category" hidden><div class="facet-options" id="facet-options-category"></div></div>
    <button class="sidebar-facet-toggle" type="button" data-facet-toggle="more">VAIRĀK FILTRU<span class="facet-chevron">▾</span></button>
    <div class="sidebar-facet-body" id="facet-body-more" hidden>
      <div class="sidebar-facet-label">STĀVOKLIS</div>
      <div class="facet-options" id="facet-options-condition"></div>
      <label class="sidebar-year-label">GADS<input type="text" id="filter-year-input" placeholder="Piem., 2012"></label>
    </div>
    <div class="sidebar-price">
      <div class="sidebar-facet-label">CENA (€)</div>
      <div class="sidebar-price-inputs"><input type="number" min="0" id="sidebar-price-min" placeholder="Min"><span>–</span><input type="number" min="0" id="sidebar-price-max" placeholder="Max"></div>
      <button class="button button-dark sidebar-apply-price" type="button" id="sidebar-apply-price">PIEMĒROT CENU</button>
    </div>`
}

export function bindCatalogSidebarFilters() {
  const sidebar = document.querySelector('#catalog-sidebar')
  if (!sidebar) return
  const products = getProducts()
  const cardsById = new Map()
  document.querySelectorAll('#product-grid .product-card').forEach((card) => cardsById.set(card.dataset.productId, card))
  const state = {
    brands: new Set(),
    models: new Set(),
    categories: new Set(),
    conditions: new Set(),
    year: '',
    priceMin: 0,
    priceMax: Infinity,
    query: '',
    modelSearch: '',
  }

  function matches(p, exclude) {
    if (exclude !== 'query' && state.query) {
      const blob = buildProductSearchBlob(p)
      if (!blob.includes(state.query)) return false
    }
    if (exclude !== 'brand' && state.brands.size && !state.brands.has(p.brand)) return false
    if (exclude !== 'model' && state.models.size && !state.models.has(p.model)) return false
    if (exclude !== 'category' && state.categories.size && !state.categories.has(p.category)) return false
    if (
      exclude !== 'condition' &&
      state.conditions.size &&
      !state.conditions.has(normalizeConditionLabel(p.condition))
    ) {
      return false
    }
    if (exclude !== 'price' && (Number(p.price) < state.priceMin || Number(p.price) > state.priceMax)) return false
    if (exclude !== 'year' && state.year && !matchesProductionYear(p.production_year, state.year)) {
      return false
    }
    return true
  }

  function countsFor(key, exclude) {
    const counts = {}
    products.forEach((p) => {
      const raw = key === 'condition' ? normalizeConditionLabel(p[key]) : p[key]
      if (raw && matches(p, exclude)) counts[raw] = (counts[raw] || 0) + 1
    })
    return counts
  }

  function renderFacet(id, key, selectedSet, searchText) {
    const holder = document.querySelector(`#facet-options-${id}`)
    if (!holder) return
    const counts = countsFor(key, id)
    const q = (searchText || '').toLowerCase()
    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .filter(([value]) => !q || value.toLowerCase().includes(q))
    holder.innerHTML = entries.length
      ? entries
          .map(
            ([value, count]) =>
              `<label class="facet-option"><input type="checkbox" data-facet-input="${id}" value="${escapeHtml(value)}" ${selectedSet.has(value) ? 'checked' : ''}><span>${escapeHtml(value)}</span><b>${count}</b></label>`,
          )
          .join('')
      : '<p class="facet-empty">Nav rezultātu.</p>'
    holder.querySelectorAll(`input[data-facet-input="${id}"]`).forEach((box) =>
      box.addEventListener('change', () => {
        if (box.checked) selectedSet.add(box.value)
        else selectedSet.delete(box.value)
        run()
      }),
    )
  }

  function renderAllFacets() {
    renderFacet('brand', 'brand', state.brands)
    renderFacet('model', 'model', state.models, state.modelSearch)
    renderFacet('category', 'category', state.categories)
    renderFacet('condition', 'condition', state.conditions)
  }

  function run() {
    let visible = 0
    products.forEach((p) => {
      const card = cardsById.get(String(p.id))
      if (!card) return
      const ok = matches(p, null)
      card.hidden = !ok
      if (ok) visible += 1
    })
    document.querySelectorAll('.product-card.card-capped').forEach((card) => card.classList.remove('card-capped'))
    document.querySelector('#catalog-show-more')?.remove()
    const noResults = document.querySelector('#no-results')
    if (noResults) noResults.hidden = visible !== 0
    const countEl = document.querySelector('#sidebar-catalog-count')
    if (countEl) countEl.innerHTML = `${visible} <span>PRECES</span>`
    renderAllFacets()
    if (isEnglish()) translatePage()
  }

  document.querySelector('#sidebar-search-input')?.addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase()
    run()
  })
  document.querySelector('#facet-search-model')?.addEventListener('input', (event) => {
    state.modelSearch = event.target.value
    renderFacet('model', 'model', state.models, state.modelSearch)
  })
  document.querySelector('#sidebar-apply-price')?.addEventListener('click', () => {
    state.priceMin = parseOptionalPrice(document.querySelector('#sidebar-price-min')?.value, 0)
    state.priceMax = parseOptionalPrice(document.querySelector('#sidebar-price-max')?.value, Infinity)
    run()
  })
  document.querySelector('#filter-year-input')?.addEventListener('input', (event) => {
    state.year = event.target.value.trim().toLowerCase()
    run()
  })
  document.querySelector('#sidebar-sort-select')?.addEventListener('change', () => {
    const grid = document.querySelector('#product-grid')
    if (!grid) return
    const sortValue = document.querySelector('#sidebar-sort-select').value
    const cards = [...grid.querySelectorAll('.product-card')]
    const isPaginated = Boolean(document.querySelector('#catalog-show-more'))
    cards.sort((a, b) => {
      if (sortValue === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price)
      if (sortValue === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price)
      return Number(a.dataset.order) - Number(b.dataset.order)
    })
    cards.forEach((card, index) => {
      if (isPaginated) card.classList.toggle('card-capped', index >= CATALOG_PAGE_SIZE)
      grid.appendChild(card)
    })
  })
  sidebar.querySelectorAll('[data-facet-toggle]').forEach((button) =>
    button.addEventListener('click', () => {
      const id = button.dataset.facetToggle
      const body = document.querySelector(`#facet-body-${id}`)
      const open = body.hasAttribute('hidden')
      if (open) body.removeAttribute('hidden')
      else body.setAttribute('hidden', '')
      button.querySelector('.facet-chevron').textContent = open ? '▴' : '▾'
    }),
  )

  renderAllFacets()
}

export function bindProductButtons() {
  const products = getProducts()
  document.querySelectorAll('.quick-add, .add-text').forEach((button) =>
    button.addEventListener('click', () => {
      const product = products.find((item) => item.id === button.dataset.id)
      if (!product) return
      const res = addToCart(product)
      const isQuick = button.classList.contains('quick-add')
      if (button.dataset.resetTimer) clearTimeout(Number(button.dataset.resetTimer))
      if (!res.ok) {
        button.textContent = isQuick ? '!' : res.reason === 'out_of_stock' ? 'NAV NOLIKTAVĀ' : 'MAKS. DAUDZUMS'
        button.dataset.resetTimer = String(
          setTimeout(() => {
            delete button.dataset.resetTimer
            button.innerHTML = isQuick ? '+' : 'PIEVIENOT <span>↗</span>'
            if (isEnglish()) translatePage()
          }, 1200),
        )
        return
      }
      button.textContent = '✓'
      button.dataset.resetTimer = String(
        setTimeout(() => {
          delete button.dataset.resetTimer
          button.innerHTML = isQuick ? '+' : 'PIEVIENOT <span>↗</span>'
          if (isEnglish()) translatePage()
        }, 900),
      )
    }),
  )
  document.querySelectorAll('.product-card').forEach((card) =>
    card.addEventListener('click', (event) => {
      if (event.target.closest('button, a')) return
      window.location.hash = `product-${card.dataset.productId}`
    }),
  )
  document.querySelector('#catalog-show-more')?.addEventListener('click', (event) => {
    document.querySelectorAll('.product-card.card-capped').forEach((card) => card.classList.remove('card-capped'))
    event.target.remove()
  })
}

export function galleryMarkup(images, altText) {
  const imgs = (images || []).map((url) => safeUrl(url)).filter(Boolean)
  if (!imgs.length) return `<div class="gallery"><div class="gallery-empty">Nav pievienotu bilžu</div></div>`
  return `<div class="gallery">
    <div class="gallery-main"><img src="${escapeHtml(imgs[0])}" alt="${escapeHtml(altText || '')}"></div>
    ${
      imgs.length > 1
        ? `<button class="gallery-arrow gallery-prev" type="button" aria-label="Iepriekšējā bilde">‹</button>
           <button class="gallery-arrow gallery-next" type="button" aria-label="Nākamā bilde">›</button>
           <div class="gallery-dots">${imgs
             .map(
               (_, i) =>
                 `<button class="gallery-dot${i === 0 ? ' active' : ''}" type="button" data-dot="${i}" aria-label="Bilde ${i + 1}"></button>`,
             )
             .join('')}</div>`
        : ''
    }
  </div>`
}

let lightboxImages = []
let lightboxIndex = 0

export function openLightbox(images, startIndex) {
  lightboxImages = images.map((url) => safeUrl(url)).filter(Boolean)
  if (!lightboxImages.length) return
  lightboxIndex = startIndex || 0
  document.querySelector('#lightbox-image').src = lightboxImages[lightboxIndex]
  const hasMultiple = lightboxImages.length > 1
  document.querySelector('#lightbox-prev').hidden = !hasMultiple
  document.querySelector('#lightbox-next').hidden = !hasMultiple
  document.querySelector('#lightbox-overlay').hidden = false
}

export function closeLightbox() {
  const overlay = document.querySelector('#lightbox-overlay')
  if (overlay) overlay.hidden = true
}

function showLightboxImage(i) {
  if (!lightboxImages.length) return
  lightboxIndex = (i + lightboxImages.length) % lightboxImages.length
  document.querySelector('#lightbox-image').src = lightboxImages[lightboxIndex]
}

export function bindLightbox() {
  document.querySelector('#lightbox-close')?.addEventListener('click', closeLightbox)
  document.querySelector('#lightbox-overlay')?.addEventListener('click', (event) => {
    if (event.target.id === 'lightbox-overlay') closeLightbox()
  })
  document.querySelector('#lightbox-prev')?.addEventListener('click', () => showLightboxImage(lightboxIndex - 1))
  document.querySelector('#lightbox-next')?.addEventListener('click', () => showLightboxImage(lightboxIndex + 1))
  document.addEventListener('keydown', (event) => {
    if (document.querySelector('#lightbox-overlay')?.hidden) return
    if (event.key === 'ArrowLeft') showLightboxImage(lightboxIndex - 1)
    if (event.key === 'ArrowRight') showLightboxImage(lightboxIndex + 1)
  })
}

export function bindGallery(container, images) {
  const imgs = (images || []).map((url) => safeUrl(url)).filter(Boolean)
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

const CATEGORY_GENITIVE = {
  dzinējs: 'Dzinēja',
  virsbūve: 'Virsbūves',
  salons: 'Salona',
  balstiekārta: 'Balstiekārtas',
  elektrība: 'Elektrības',
  'riteņi un diski': 'Riteņu un disku',
}

export function categoryPage(categoryValue) {
  const products = getProducts()
  const label = CATEGORIES.find((c) => c[3] === categoryValue)?.[1] || escapeHtml(categoryValue)
  const headingLabel = CATEGORY_GENITIVE[categoryValue] || label
  const matchingProducts = products
    .filter((product) => (product.category || '').toLowerCase() === categoryValue)
    .sort((a, b) => a.name.localeCompare(b.name, 'lv'))
  return `<section class="page-hero">
      <a class="back-link" href="#home">← ATPAKAĻ UZ SĀKUMU</a>
      <div class="section-kicker">KATEGORIJA / <span>${label}</span></div>
      <h1>${headingLabel}<br><em>detaļas.</em></h1>
      <p>Šeit redzamas tikai <span>${headingLabel}</span> detaļas no kataloga un kopienas sludinājumiem.</p>
    </section>
    <section class="product-section category-products reveal">
      <div class="section-top">
        <div>
          <div class="section-kicker">TRACKPARTS KATALOGS</div>
          <h2>Kataloga <em>preces.</em></h2>
        </div>
        <a class="text-link" href="#catalog">VISAS KATEGORIJAS <span>↗</span></a>
      </div>
      ${
        matchingProducts.length
          ? `<div class="sidebar-search category-search"><span aria-hidden="true">⌕</span><input id="category-search-input" placeholder="Meklē..."></div>`
          : ''
      }
      ${
        matchingProducts.length
          ? productGridMarkup(matchingProducts)
          : '<p class="listing-loading">Šajā kategorijā pašlaik nav kataloga preču.</p>'
      }
    </section>
    <section class="listings-section category-listings reveal">
      <div class="section-top">
        <div>
          <div class="section-kicker">KOPIENAS SLUDINĀJUMI / <span>${label}</span></div>
          <h2>Citi pārdod <em><span>${label}</span>.</em></h2>
        </div>
        <a class="button button-dark" href="#sell">PĀRDOT ŠEIT ↗</a>
      </div>
      <div class="listing-table" id="category-listing-table"><p class="listing-loading">Ielādējam sludinājumus...</p></div>
    </section>`
}

export function bindCategorySearch() {
  const input = document.querySelector('#category-search-input')
  if (!input) return
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase()
    let visible = 0
    document.querySelectorAll('.category-products .product-card').forEach((card) => {
      const match = !query || (card.dataset.name || '').includes(query)
      card.hidden = !match
      if (match) visible += 1
    })
    const empty = document.querySelector('.category-products #no-results')
    if (empty) empty.hidden = visible !== 0
  })
}

export const productDetailPage = `<section class="detail-page product-detail">
  <a class="back-link" href="#catalog">← ATPAKAĻ UZ KATALOGU</a>
  <div class="detail-layout">
    <div>
      <div id="product-gallery"></div>
      <div class="section-kicker">KATALOGA PRECE</div>
      <h1 id="product-title">Ielādē...</h1>
      <p id="product-description" class="detail-description"></p>
    </div>
    <aside class="seller-panel">
      <span class="product-tag" id="product-stock-badge">IR NOLIKTAVĀ</span>
      <strong id="product-price"></strong>
      <button class="button button-dark product-buy-btn" id="product-add" type="button">PIEVIENOT GROZAM ↗</button>
      <p class="form-message" id="product-add-message"></p>
      <div class="detail-data" id="product-data"></div>
    </aside>
  </div>
</section>`

export function loadProductDetail(id) {
  const products = getProducts()
  const product = products.find((item) => item.id === id)
  const titleEl = document.querySelector('#product-title')
  if (!titleEl) return
  if (!product) {
    if (isProductsLoaded()) {
      titleEl.textContent = 'Detaļa nav atrasta'
      document.querySelector('#product-description').textContent = 'Šī prece vairs nav pieejama katalogā.'
      document.querySelector('#product-add').hidden = true
      document.querySelector('#product-stock-badge').hidden = true
      if (isEnglish()) translatePage()
    }
    return
  }

  const stock = getAvailableStock(product)
  const outOfStock = stock <= 0
  const images = (product.images?.length ? product.images : [product.image]).filter(Boolean)
  document.querySelector('#product-gallery').innerHTML = galleryMarkup(images, product.name)
  bindGallery(document.querySelector('#product-gallery'), images)
  titleEl.textContent = product.name
  document.title = `${product.name} — TrackParts`
  document.querySelector('#product-description').textContent = product.description || ''
  document.querySelector('#product-price').textContent = formatPrice(product.price)

  const stockBadge = document.querySelector('#product-stock-badge')
  stockBadge.hidden = false
  stockBadge.textContent = outOfStock ? 'NAV NOLIKTAVĀ' : 'IR NOLIKTAVĀ'
  stockBadge.classList.toggle('is-soldout', outOfStock)

  document.querySelector('#product-data').innerHTML = `
    <span>OEM NUMURS<strong>${escapeHtml(product.oem || '-')}</strong></span>
    <span>RAŽOTĀJA KODS<strong>${escapeHtml(product.code || '-')}</strong></span>
    <span>RAŽOTĀJS<strong>${escapeHtml(product.manufacturer || '-')}</strong></span>
    <span>AUTO<strong>${escapeHtml(product.brand || '')} ${escapeHtml(product.model || '')}</strong></span>
    <span>GADS / DZINĒJS<strong>${escapeHtml(product.production_year || '-')} / ${escapeHtml(product.engine || '-')}</strong></span>
    <span>KATEGORIJA<strong>${escapeHtml(product.category)}</strong></span>
    <span>STĀVOKLIS<strong>${escapeHtml(product.condition || '-')}</strong></span>
    <span>NOLIKTAVA<strong>${escapeHtml(product.location || '-')} · Atlikums: ${stockLabel(product.stock)}</strong></span>
    <span>SVARS / IZMĒRI<strong>${escapeHtml(product.weight || '-')} · ${escapeHtml(product.dimensions || '-')}</strong></span>
    <span>GARANTIJA<strong>${escapeHtml(product.warranty || '-')}</strong></span>`

  const addBtn = document.querySelector('#product-add')
  const msgEl = document.querySelector('#product-add-message')
  addBtn.hidden = false
  addBtn.disabled = outOfStock
  addBtn.textContent = outOfStock ? 'NAV NOLIKTAVĀ' : 'PIEVIENOT GROZAM ↗'
  addBtn.onclick = () => {
    const res = addToCart(product)
    if (!res.ok) {
      msgEl.textContent =
        res.reason === 'out_of_stock'
          ? 'Šī detaļa pašlaik nav noliktavā.'
          : 'Sasniegts pieejamais atlikums noliktavā.'
      if (isEnglish()) translatePage()
      return
    }
    msgEl.textContent = ''
    if (addBtn.dataset.resetTimer) clearTimeout(Number(addBtn.dataset.resetTimer))
    addBtn.textContent = '✓ PIEVIENOTS GROZAM'
    if (isEnglish()) translatePage()
    addBtn.dataset.resetTimer = String(
      setTimeout(() => {
        delete addBtn.dataset.resetTimer
        addBtn.textContent = 'PIEVIENOT GROZAM ↗'
        if (isEnglish()) translatePage()
      }, 1200),
    )
  }
  primeAndTranslate()
}
