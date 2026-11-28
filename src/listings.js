import { supabase } from './lib/supabase.js'
import { CONDITION_NAMES } from './data.js'
import {
  escapeHtml,
  escapeIlikePattern,
  formatPrice,
  formatTelHref,
  isSpamSubmit,
  safeUrl,
  sanitizeUploadFilename,
  validateImageFiles,
  withSubmitLock,
} from './utils.js'
import { isTranslated, primeAndTranslate, translatePage } from './i18n.js'
import { bindGallery, galleryMarkup } from './catalog.js'
import { enhanceSelects } from './selects.js'
import { showToast } from './fx.js'

export const listingsPage = `<section class="page-hero">
  <div class="section-kicker">04 / KOPIENAS TIRGUS</div>
  <h1>Redzi, ko citi<br><em>pārdod.</em></h1>
  <p>Īstas detaļas no TrackApart kopienas. Atver sludinājumu, lai redzētu pārdevēju un sazinātos.</p>
</section>
<section class="listings-section listings-page">
  <div class="section-top">
    <div>
      <div class="section-kicker">AKTĪVIE SLUDINĀJUMI</div>
      <h2>Jaunākie <em>sludinājumi.</em></h2>
    </div>
    <a class="button button-dark" href="#sell">PĀRDOT DETAĻU ↗</a>
  </div>
  <input class="listings-search" id="listings-search" placeholder="Meklē pēc nosaukuma, markas vai modeļa">
  <div class="listing-table" id="listing-table">
    <div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div>
    <p class="listing-loading">Ielādējam sludinājumus...</p>
  </div>
  <p class="no-results" id="listings-no-results" hidden>Neviena prece neatbilst meklējumam.</p>
</section>`

export const listingDetailPage = `<section class="detail-page">
  <a class="back-link" href="#listings">← ATPAKAĻ UZ SLUDINĀJUMIEM</a>
  <div class="detail-layout">
    <div>
      <div id="detail-gallery"></div>
      <div class="section-kicker">SLUDINĀJUMA INFORMĀCIJA</div>
      <h1 id="detail-title">Ielādē...</h1>
      <p id="detail-description" class="detail-description"></p>
    </div>
    <aside class="seller-panel">
      <div class="seller-panel-top">
        <span class="product-tag">AKTĪVS SLUDINĀJUMS</span>
        <button class="favorite-toggle" id="detail-favorite" type="button" aria-label="Saglabāt sludinājumu" hidden>♡ SAGLABĀT</button>
      </div>
      <strong id="detail-price"></strong>
      <div class="detail-data" id="detail-data"></div>
      <hr>
      <small>PĀRDEVĒJS</small>
      <h3 id="detail-seller"></h3>
      <a id="detail-phone" class="seller-contact" href="mailto:hello@trackapart.lv">SAZINĀTIES ↗</a>
      <a class="seller-contact" href="mailto:hello@trackapart.lv">RAKSTĪT E-PASTU ↗</a>
      <div class="report-block" id="detail-report-block" hidden>
        <hr>
        <button class="text-button report-toggle" id="detail-report-toggle" type="button">ZIŅOT PAR SLUDINĀJUMU</button>
        <form class="report-form" id="detail-report-form" hidden>
          <textarea name="reason" rows="3" required maxlength="500" placeholder="Apraksti iemeslu (piem., maldinošs apraksts vai aizdomīgs sludinājums)"></textarea>
          <button class="button button-dark" type="submit">NOSŪTĪT ZIŅOJUMU ↗</button>
          <p class="form-message" id="detail-report-message"></p>
        </form>
      </div>
    </aside>
  </div>
</section>`

export const sellerProfilePage = `<section class="profile-hero" id="seller-hero">
  <div class="profile-hero-top">
    <a class="back-link" href="#listings">← ATPAKAĻ UZ SLUDINĀJUMIEM</a>
    <div class="profile-hero-actions" id="seller-hero-actions">
      <button class="profile-action-btn" id="profile-share-btn" type="button">KOPĒT SAITI</button>
    </div>
  </div>
  <div class="profile-identity">
    <div class="profile-avatar" id="seller-avatar" aria-hidden="true"><span>--</span></div>
    <div class="profile-identity-body">
      <div class="profile-kicker-row">
        <span class="section-kicker">PĀRDEVĒJA PROFILS</span>
        <div class="profile-badges" id="seller-badges"></div>
      </div>
      <h1 id="seller-name">Ielādē...</h1>
      <div class="profile-meta-row" id="seller-meta"></div>
      <div class="profile-brand-tags" id="seller-brands"></div>
    </div>
  </div>
  <div class="profile-kpis" id="seller-kpis">
    <button class="profile-kpi is-clickable" type="button" data-jump-tab="reviews">
      <span class="profile-kpi-label">VIDĒJAIS VĒRTĒJUMS</span>
      <strong class="profile-kpi-val" id="kpi-rating">—</strong>
      <span class="profile-kpi-sub" id="kpi-rating-stars"></span>
    </button>
    <button class="profile-kpi is-clickable" type="button" data-jump-tab="reviews">
      <span class="profile-kpi-label">ATSAUKSMES</span>
      <strong class="profile-kpi-val" id="kpi-reviews">0</strong>
      <span class="profile-kpi-sub" id="kpi-positive">Vēl nav atsauksmju</span>
    </button>
    <button class="profile-kpi is-clickable" type="button" data-jump-tab="listings">
      <span class="profile-kpi-label">AKTĪVIE SLUDINĀJUMI</span>
      <strong class="profile-kpi-val" id="kpi-listings">0</strong>
      <span class="profile-kpi-sub">Pieejamas detaļas</span>
    </button>
    <div class="profile-kpi">
      <span class="profile-kpi-label">DALĪBNIEKS KOPŠ</span>
      <strong class="profile-kpi-val" id="kpi-since">—</strong>
      <span class="profile-kpi-sub">TrackApart kopiena</span>
    </div>
  </div>
</section>

<nav class="profile-tabs-bar" aria-label="Profila sadaļas">
  <div class="profile-tabs">
    <button class="profile-tab active" type="button" data-profile-tab="all">PĀRSKATS</button>
    <button class="profile-tab" type="button" data-profile-tab="listings">SLUDINĀJUMI <b id="tab-count-listings">0</b></button>
    <button class="profile-tab" type="button" data-profile-tab="reviews">ATSAUKSMES <b id="tab-count-reviews">0</b></button>
  </div>
</nav>

<section class="profile-section reveal" id="profile-listings-section">
  <div class="section-top profile-section-head">
    <div>
      <div class="section-kicker">AKTĪVIE SLUDINĀJUMI</div>
      <h2>Pārdevēja <em>sludinājumi.</em></h2>
    </div>
    <div class="profile-listings-search-wrap" id="seller-listings-search-wrap" hidden>
      <span aria-hidden="true">⌕</span>
      <input id="seller-listings-search" placeholder="Meklēt pārdevēja detaļās...">
    </div>
  </div>
  <div id="seller-listings"><p class="listing-loading">Ielādējam...</p></div>
  <p class="no-results" id="seller-listings-empty" hidden>Neviena prece neatbilst meklējumam.</p>
</section>

<section class="profile-section profile-reviews-section reveal" id="profile-reviews-section">
  <div class="section-top">
    <div>
      <div class="section-kicker">ATSAUKSMES UN VĒRTĒJUMI</div>
      <h2>Ko saka <em>pircēji.</em></h2>
    </div>
  </div>
  <div class="profile-reviews-layout">
    <aside class="profile-rating-sidebar">
      <div class="rating-summary-card" id="seller-rating-summary"></div>
      <div class="profile-review-card" id="seller-review-form-holder"></div>
    </aside>
    <div class="profile-reviews-feed">
      <div class="reviews-toolbar" id="seller-reviews-toolbar" hidden>
        <div class="reviews-toolbar-left">
          <span class="reviews-toolbar-count" id="reviews-visible-count"></span>
          <button class="reviews-filter-chip" id="reviews-clear-filter" type="button" hidden></button>
        </div>
        <select id="reviews-sort-select" aria-label="Kārtot atsauksmes">
          <option value="newest">Jaunākās</option>
          <option value="highest">Augstākais vērtējums</option>
          <option value="lowest">Zemākais vērtējums</option>
        </select>
      </div>
      <div class="reviews-cards" id="seller-reviews"><p class="listing-loading">Ielādējam...</p></div>
    </div>
  </div>
</section>`

export async function fetchListingThumbnails(rows) {
  const thumbs = {}
  const realIds = []
  rows.forEach((row) => {
    if (row.images?.length) thumbs[row.id] = row.images[0]
    else if (row.id) realIds.push(row.id)
  })
  if (supabase && realIds.length) {
    const { data } = await supabase
      .from('listing_images')
      .select('listing_id, storage_path')
      .in('listing_id', realIds)
      .order('sort_order')
    ;(data || []).forEach((img) => {
      const storagePath = String(img.storage_path || '').trim()
      if (storagePath && !thumbs[img.listing_id]) {
        thumbs[img.listing_id] = supabase.storage.from('listing-images').getPublicUrl(storagePath).data.publicUrl
      }
    })
  }
  return thumbs
}

export function listingThumbMarkup(url) {
  const safe = escapeHtml(safeUrl(url))
  return `<span class="listing-thumb">${safe ? `<img src="${safe}" alt="" loading="lazy">` : ''}</span>`
}

function listingRowsMarkup(rows, thumbs) {
  return `<div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div>${rows
    .map(
      (row) =>
        `<a class="listing-row" data-search="${escapeHtml([row.title, row.brand, row.model, row.location, row.oem_number].filter(Boolean).join(' ').toLowerCase())}" href="#listing-${escapeHtml(row.id)}">
          <div class="listing-title-cell">${listingThumbMarkup(thumbs[row.id])}<strong>${escapeHtml(row.title)}</strong></div>
          <span>${escapeHtml(row.brand || '-')} ${escapeHtml(row.model || '')}</span>
          <span>${escapeHtml(CONDITION_NAMES[row.condition] || row.condition || 'Nav norādīts')}</span>
          <b>${formatPrice(row.price)}</b>
          <span class="listing-arrow">↗</span>
        </a>`,
    )
    .join('')}`
}

export async function loadListings() {
  const targets = document.querySelectorAll('#listing-table')
  if (!targets.length) return
  const isFullPage = Boolean(document.querySelector('.listings-page'))
  let rows = []
  if (supabase) {
    const { data } = await supabase
      .from('listings')
      .select('id, title, brand, model, condition, price, location, oem_number')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(isFullPage ? 50 : 8)
    if (data) rows = data
  }
  const thumbs = rows.length ? await fetchListingThumbnails(rows) : {}
  const html = rows.length
    ? listingRowsMarkup(rows, thumbs)
    : '<p class="listing-loading">Pašlaik nav neviena aktīva sludinājuma.</p>'
  targets.forEach((target) => {
    target.innerHTML = html
  })
  bindListingsFilter()
  primeAndTranslate()
}

function bindListingsFilter() {
  const input = document.querySelector('#listings-search')
  if (!input || input.dataset.bound) return
  input.dataset.bound = 'true'
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase()
    let visible = 0
    document.querySelectorAll('.listing-row[data-search]').forEach((row) => {
      const match = query.length === 0 || row.dataset.search.includes(query)
      row.hidden = !match
      if (match) visible += 1
    })
    const empty = document.querySelector('#listings-no-results')
    if (empty) empty.hidden = visible !== 0
  })
}

export async function loadCategoryListings(categoryValue) {
  const target = document.querySelector('#category-listing-table')
  if (!target) return
  let rows = []
  if (supabase) {
    const { data } = await supabase
      .from('listings')
      .select('id, title, brand, model, condition, price, location, category, oem_number')
      .eq('status', 'active')
      .ilike('category', escapeIlikePattern(categoryValue))
      .order('created_at', { ascending: false })
      .limit(8)
    if (data) rows = data
  }
  const thumbs = rows.length ? await fetchListingThumbnails(rows) : {}
  target.innerHTML = rows.length
    ? listingRowsMarkup(rows, thumbs)
    : '<p class="listing-loading">Šajā kategorijā pašlaik nav aktīvu sludinājumu.</p>'
  primeAndTranslate()
}

async function bindFavoriteToggle(listing, openAuthModal) {
  const button = document.querySelector('#detail-favorite')
  if (!button) return
  if (!supabase || !listing?.id) {
    button.hidden = true
    return
  }
  button.hidden = false
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let isFavorite = false
  if (user) {
    const { data } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('listing_id', listing.id)
      .maybeSingle()
    isFavorite = Boolean(data)
  }
  const paint = () => {
    button.textContent = isFavorite ? '♥ SAGLABĀTS' : '♡ SAGLABĀT'
    button.classList.toggle('is-active', isFavorite)
    if (isTranslated()) translatePage()
  }
  paint()
  button.onclick = async () => {
    const {
      data: { user: current },
    } = await supabase.auth.getUser()
    if (!current) {
      openAuthModal('login')
      return
    }
    const { error } = isFavorite
      ? await supabase.from('favorites').delete().eq('user_id', current.id).eq('listing_id', listing.id)
      : await supabase.from('favorites').insert({ user_id: current.id, listing_id: listing.id })
    if (error) return
    isFavorite = !isFavorite
    paint()
  }
}

function bindReportListing(listing, openAuthModal) {
  const block = document.querySelector('#detail-report-block')
  const toggle = document.querySelector('#detail-report-toggle')
  const form = document.querySelector('#detail-report-form')
  const message = document.querySelector('#detail-report-message')
  if (!block || !toggle || !form) return
  if (!supabase || !listing?.id) {
    block.hidden = true
    return
  }
  block.hidden = false
  toggle.onclick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      openAuthModal('login')
      return
    }
    form.hidden = !form.hidden
  }
  form.onsubmit = async (event) => {
    event.preventDefault()
    await withSubmitLock(form, async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        openAuthModal('login')
        return
      }
      const reason = String(new FormData(form).get('reason') || '').trim()
      if (!reason) return
      const { error } = await supabase
        .from('reports')
        .insert({ listing_id: listing.id, reporter_id: user.id, reason })
      if (error) {
        message.textContent =
          error.code === '23505' ? 'Tu jau esi ziņojis par šo sludinājumu.' : error.message
        if (isTranslated()) translatePage()
        return
      }
      message.textContent = 'Paldies! Ziņojums nosūtīts administrācijai.'
      if (isTranslated()) translatePage()
      form.reset()
    })
  }
}

export async function loadListingDetail(id, openAuthModal) {
  let listing = null
  if (supabase && id) {
    const { data } = await supabase
      .from('listings')
      .select('id, title, description, price, condition, brand, model, production_year, engine, location, user_id')
      .eq('id', id)
      .single()
    if (data) {
      listing = { ...data, seller: 'Lietotājs', phone: '' }
      const rpcSeller = await supabase.rpc('get_listing_seller', { target_listing_id: data.id })
      const sellerRow = Array.isArray(rpcSeller.data) ? rpcSeller.data[0] : rpcSeller.data
      if (!rpcSeller.error && sellerRow) {
        listing = {
          ...listing,
          seller: sellerRow.display_name || 'Lietotājs',
          phone: sellerRow.phone || '',
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone')
          .eq('id', data.user_id)
          .maybeSingle()
        if (profile) {
          listing = {
            ...listing,
            seller: profile.display_name || 'Lietotājs',
            phone: profile.phone || '',
          }
        }
      }
    }
  }
  if (!document.querySelector('#detail-gallery')) return
  if (!listing) {
    document.querySelector('#detail-title').textContent = 'Sludinājums nav atrasts'
    if (isTranslated()) translatePage()
    return
  }
  let images = listing.images || []
  let sellerRatings = []
  if (supabase && listing.id) {
    const [{ data: imageRows }, { data: ratingRows }] = await Promise.all([
      supabase.from('listing_images').select('storage_path').eq('listing_id', id).order('sort_order'),
      listing.user_id
        ? supabase.from('reviews').select('rating').eq('seller_id', listing.user_id)
        : Promise.resolve({ data: [] }),
    ])
    images = (imageRows || [])
      .map((row) => String(row.storage_path || '').trim())
      .filter(Boolean)
      .map((storagePath) => supabase.storage.from('listing-images').getPublicUrl(storagePath).data.publicUrl)
    sellerRatings = ratingRows || []
  }
  if (!document.querySelector('#detail-gallery')) return
  document.querySelector('#detail-gallery').innerHTML = galleryMarkup(images, listing.title)
  bindGallery(document.querySelector('#detail-gallery'), images)
  document.querySelector('#detail-title').textContent = listing.title
  document.title = `${listing.title} — TrackApart`
  document.querySelector('#detail-description').textContent =
    listing.description || 'Pārdevējs nav pievienojis aprakstu.'
  document.querySelector('#detail-price').textContent = formatPrice(listing.price)
  document.querySelector('#detail-data').innerHTML = `
    <span>AUTO<strong>${escapeHtml(listing.brand || '-')} ${escapeHtml(listing.model || '')}</strong></span>
    <span>STĀVOKLIS<strong>${escapeHtml(CONDITION_NAMES[listing.condition] || listing.condition || 'Nav norādīts')}</strong></span>
    <span>ATRAŠANĀS VIETA<strong>${escapeHtml(listing.location || 'Nav norādīta')}</strong></span>`
  const sellerHeading = document.querySelector('#detail-seller')
  const sellerDisplayName = listing.seller || 'Privāts pārdevējs'
  const sellerStats = computeRatingStats(sellerRatings)
  const sellerSub = sellerStats.count
    ? `<span class="seller-mini-rating">★ ${sellerStats.average.toFixed(1)} <small>(${sellerStats.count})</small></span>`
    : `<span class="seller-mini-rating is-empty">Jauns pārdevējs</span>`
  if (listing.user_id) {
    sellerHeading.innerHTML = `<a class="seller-mini-card" href="#seller-${escapeHtml(listing.user_id)}">
      <span class="seller-mini-avatar" aria-hidden="true">${escapeHtml(getInitials(sellerDisplayName))}</span>
      <span class="seller-mini-info">
        <strong>${escapeHtml(sellerDisplayName)}</strong>
        ${sellerSub}
      </span>
      <span class="seller-mini-arrow" aria-hidden="true">↗</span>
    </a>`
  } else {
    sellerHeading.textContent = sellerDisplayName
  }
  const phone = document.querySelector('#detail-phone')
  const telHref = formatTelHref(listing.phone)
  if (telHref) {
    phone.hidden = false
    phone.textContent = `${listing.phone.trim()} ↗`
    phone.href = telHref
  } else {
    phone.hidden = true
  }
  await bindFavoriteToggle(listing, openAuthModal)
  bindReportListing(listing, openAuthModal)
  primeAndTranslate()
}

const RATING_LABELS = {
  1: 'Slikti',
  2: 'Viduvēji',
  3: 'Labi',
  4: 'Ļoti labi',
  5: 'Izcili!',
}

export function getInitials(name) {
  const cleaned = String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
  if (!cleaned) return 'TA'
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return cleaned.slice(0, 2).toUpperCase()
}

export function computeRatingStats(reviews) {
  const list = Array.isArray(reviews) ? reviews : []
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let sum = 0
  let positive = 0
  for (const r of list) {
    const val = Math.max(1, Math.min(5, Math.round(Number(r?.rating) || 0)))
    if (val >= 1 && val <= 5) {
      breakdown[val] += 1
      sum += val
      if (val >= 4) positive += 1
    }
  }
  const count = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return {
    count,
    average: count ? sum / count : 0,
    positivePercent: count ? Math.round((positive / count) * 100) : 0,
    breakdown,
  }
}

export function renderStarsSvg(rating, { size = 14 } = {}) {
  const rounded = Math.round(Number(rating || 0) * 2) / 2
  return `<span class="tp-stars" aria-label="${Number(rating || 0).toFixed(1)} / 5">${[1, 2, 3, 4, 5]
    .map((n) => {
      const filled = n <= rounded
      return `<svg class="tp-star${filled ? ' is-filled' : ''}" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.42l-4.94 2.6.94-5.51-4-3.9 5.53-.8L10 1.8z" fill="currentColor"/></svg>`
    })
    .join('')}</span>`
}

const PIN_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.5s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="7.5" r="2" stroke="currentColor" stroke-width="1.6"/></svg>`
const CALENDAR_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" stroke="currentColor" stroke-width="1.6"/><path d="M3 8.5h14M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`

function reviewFormMarkup(existing) {
  const currentRating = existing?.rating || 0
  const commentLen = (existing?.comment || '').length
  return `<div class="profile-review-card-head">
      <div class="section-kicker">${existing ? 'TAVA ATSAUKSME' : 'ATSTĀT ATSAUKSMI'}</div>
      <h3>${existing ? 'Rediģē savu vērtējumu' : 'Novērtē pārdevēju'}</h3>
    </div>
    <form class="site-form review-form" id="review-form">
      <label>VĒRTĒJUMS
        <div class="star-picker-row">
          <div class="star-rating" id="star-rating" role="radiogroup" aria-label="Vērtējums">
            ${[1, 2, 3, 4, 5]
              .map(
                (n) =>
                  `<button type="button" class="star-input" data-star="${n}" aria-label="Vērtēt ar ${n} no 5">★</button>`,
              )
              .join('')}
            <input type="hidden" name="rating" value="${currentRating}">
          </div>
          <span class="star-rating-label" id="star-rating-label">${currentRating ? RATING_LABELS[currentRating] : 'Izvēlies zvaigznes'}</span>
        </div>
      </label>
      <label>KOMENTĀRS
        <textarea name="comment" id="review-comment-input" rows="3" maxlength="1000" placeholder="Kā pagāja darījums?">${escapeHtml(existing?.comment || '')}</textarea>
        <span class="review-char-count" id="review-char-count">${commentLen} / 1000</span>
      </label>
      <div class="form-actions review-form-actions">
        <button class="button button-dark" type="submit">${existing ? 'ATJAUNOT ATSAUKSMI ↗' : 'PUBLICĒT ATSAUKSMI ↗'}</button>
        ${existing ? '<button class="text-button review-delete-btn" id="review-delete-btn" type="button">DZĒST</button>' : ''}
      </div>
      <p class="form-message" id="review-message"></p>
    </form>`
}

function bindReviewForm(sellerId, reviewerId, openAuthModal) {
  const form = document.querySelector('#review-form')
  if (!form) return
  const ratingInput = form.querySelector('input[name="rating"]')
  const ratingLabel = form.querySelector('#star-rating-label')
  const commentInput = form.querySelector('#review-comment-input')
  const charCount = form.querySelector('#review-char-count')
  const stars = form.querySelectorAll('.star-input')

  const paintStars = (n, preview = false) => {
    stars.forEach((btn) => {
      const val = Number(btn.dataset.star)
      btn.classList.toggle('is-active', !preview && val <= n)
      btn.classList.toggle('is-preview', preview && val <= n)
    })
    if (ratingLabel) {
      ratingLabel.textContent = n ? RATING_LABELS[n] : 'Izvēlies zvaigznes'
      if (isTranslated()) translatePage()
    }
  }
  paintStars(Number(ratingInput.value))

  stars.forEach((btn) => {
    btn.addEventListener('mouseenter', () => paintStars(Number(btn.dataset.star), true))
    btn.addEventListener('mouseleave', () => paintStars(Number(ratingInput.value), false))
    btn.addEventListener('click', () => {
      ratingInput.value = btn.dataset.star
      paintStars(Number(btn.dataset.star), false)
    })
  })

  commentInput?.addEventListener('input', () => {
    if (charCount) charCount.textContent = `${commentInput.value.length} / 1000`
  })

  document.querySelector('#review-delete-btn')?.addEventListener('click', async () => {
    if (!window.confirm('Dzēst tavu atsauksmi?')) return
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('seller_id', sellerId)
      .eq('reviewer_id', reviewerId)
    if (error) {
      const msg = document.querySelector('#review-message')
      if (msg) msg.textContent = error.message
      return
    }
    showToast('Atsauksme dzēsta.')
    await loadSellerProfile(sellerId, openAuthModal)
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    await withSubmitLock(form, async () => {
      const message = document.querySelector('#review-message')
      const rating = Number(ratingInput.value)
      if (!rating) {
        message.textContent = 'Izvēlies vērtējumu.'
        if (isTranslated()) translatePage()
        return
      }
      const data = new FormData(form)
      const { error } = await supabase
        .from('reviews')
        .upsert(
          { seller_id: sellerId, reviewer_id: reviewerId, rating, comment: data.get('comment') },
          { onConflict: 'seller_id,reviewer_id' },
        )
      if (error) {
        message.textContent = error.message
        return
      }
      showToast('Atsauksme saglabāta!')
      await loadSellerProfile(sellerId, openAuthModal)
    })
  })
}

async function fetchPublicProfilesByIds(ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))]
  if (!supabase || !uniqueIds.length) return []
  const rpcRes = await supabase.rpc('get_public_profiles', { user_ids: uniqueIds })
  if (!rpcRes.error && Array.isArray(rpcRes.data)) return rpcRes.data
  const fallback = await supabase.from('profiles').select('id, display_name, city, created_at').in('id', uniqueIds)
  return fallback.data || []
}

function sellerListingCardsMarkup(listings, thumbs) {
  return `<div class="profile-listings-grid">${listings
    .map((row) => {
      const thumbUrl = escapeHtml(safeUrl(thumbs[row.id]))
      const condLabel = CONDITION_NAMES[row.condition] || row.condition || ''
      const searchText = [row.title, row.brand, row.model, row.location, row.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return `<a class="profile-listing-card" href="#listing-${escapeHtml(row.id)}" data-seller-search="${escapeHtml(searchText)}">
        <div class="profile-listing-media">
          ${thumbUrl ? `<img src="${thumbUrl}" alt="${escapeHtml(row.title)}" loading="lazy">` : '<div class="gallery-empty">Nav bildes</div>'}
          ${condLabel ? `<span class="product-tag">${escapeHtml(condLabel)}</span>` : ''}
        </div>
        <div class="profile-listing-body">
          <div class="product-meta">
            <span>${escapeHtml([row.brand, row.model].filter(Boolean).join(' ') || 'Auto detaļa')}</span>
            <small>${escapeHtml(row.location || '')}</small>
          </div>
          <h3>${escapeHtml(row.title)}</h3>
          <div class="product-bottom">
            <strong>${formatPrice(row.price)}</strong>
            <span class="profile-listing-cta">SKATĪT <b>↗</b></span>
          </div>
        </div>
      </a>`
    })
    .join('')}</div>`
}

function ratingSummaryMarkup(stats, activeStarFilter) {
  const scoreDisplay = stats.count ? stats.average.toFixed(1) : '—'
  return `<div class="rating-summary-head">
      <div class="rating-score-big">
        <strong>${scoreDisplay}</strong>
        <span>/ 5</span>
      </div>
      <div class="rating-score-meta">
        ${renderStarsSvg(stats.average, { size: 16 })}
        <p>${stats.count ? `<span>${stats.count}</span> <span>${stats.count === 1 ? 'atsauksme' : 'atsauksmes'}</span>` : 'Vēl nav atsauksmju'}</p>
        ${stats.count ? `<span class="rating-positive-pill"><span>${stats.positivePercent}%</span> <span>pozitīvas</span></span>` : ''}
      </div>
    </div>
    <div class="rating-bars" role="group" aria-label="Vērtējumu sadalījums">
      ${[5, 4, 3, 2, 1]
        .map((star) => {
          const n = stats.breakdown[star] || 0
          const pct = stats.count ? Math.round((n / stats.count) * 100) : 0
          const isSelected = activeStarFilter === star
          return `<button class="rating-bar-row${isSelected ? ' is-selected' : ''}" type="button" data-filter-star="${star}" ${n === 0 ? 'disabled' : ''}>
            <span class="rating-bar-label">${star} ★</span>
            <span class="rating-bar-track"><i style="width:${pct}%"></i></span>
            <span class="rating-bar-count">${n}</span>
          </button>`
        })
        .join('')}
    </div>`
}

function reviewCardsMarkup(reviews, reviewerMap, currentUserId) {
  if (!reviews.length) {
    return '<div class="profile-empty-state"><p>Vēl nav nevienas atsauksmes.</p></div>'
  }
  return reviews
    .map((r) => {
      const reviewer = reviewerMap.get(r.reviewer_id)
      const reviewerName = reviewer?.display_name || 'Lietotājs'
      const reviewerCity = reviewer?.city || ''
      const isMine = currentUserId && r.reviewer_id === currentUserId
      const dateStr = new Date(r.created_at).toLocaleDateString('lv-LV')
      return `<article class="review-card${isMine ? ' is-own-review' : ''}">
        <div class="review-card-head">
          <a class="review-author" href="#seller-${escapeHtml(r.reviewer_id)}">
            <span class="review-avatar" aria-hidden="true">${escapeHtml(getInitials(reviewerName))}</span>
            <span class="review-author-meta">
              <strong>${escapeHtml(reviewerName)}${isMine ? ' <em class="review-own-pill">Tava atsauksme</em>' : ''}</strong>
              <small>${escapeHtml([reviewerCity, dateStr].filter(Boolean).join(' · '))}</small>
            </span>
          </a>
          <div class="review-score-badge">
            ${renderStarsSvg(r.rating, { size: 13 })}
            <b>${Number(r.rating).toFixed(1)}</b>
          </div>
        </div>
        ${
          r.comment
            ? `<p class="review-card-body">${escapeHtml(r.comment)}</p>`
            : '<p class="review-card-body is-empty">Bez komentāra.</p>'
        }
      </article>`
    })
    .join('')
}

export async function loadSellerProfile(id, openAuthModal) {
  if (!supabase) return
  const [{ data: { user } }, { data: reviews }, { data: listings }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('reviews')
      .select('rating, comment, created_at, reviewer_id')
      .eq('seller_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('listings')
      .select('id, title, brand, model, price, condition, location, category')
      .eq('user_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])
  const reviewerIds = [...new Set((reviews || []).map((r) => r.reviewer_id))]
  const [publicProfiles, thumbs] = await Promise.all([
    fetchPublicProfilesByIds([id, ...reviewerIds]),
    fetchListingThumbnails(listings || []),
  ])
  const profile = publicProfiles.find((p) => p.id === id) || null
  const reviewerMap = new Map(publicProfiles.map((p) => [p.id, p]))
  if (!document.querySelector('#seller-name')) return

  const displayName = profile?.display_name || 'Pārdevējs'
  const activeListings = listings || []
  const allReviews = reviews || []
  const stats = computeRatingStats(allReviews)
  const isOwnProfile = Boolean(user && user.id === id)

  document.title = `${displayName} — TrackApart`
  document.querySelector('#seller-name').textContent = displayName

  // Avatar monogram + live active indicator
  const avatarEl = document.querySelector('#seller-avatar')
  if (avatarEl) {
    avatarEl.innerHTML = `<span>${escapeHtml(getInitials(displayName))}</span>${activeListings.length ? '<i class="profile-avatar-dot" title="Aktīvs pārdevējs"></i>' : ''}`
  }

  // Hero action buttons (Share + Edit if own profile)
  const actionsEl = document.querySelector('#seller-hero-actions')
  if (actionsEl) {
    actionsEl.innerHTML = `<button class="profile-action-btn" id="profile-share-btn" type="button">KOPĒT SAITI</button>${
      isOwnProfile ? '<a class="profile-action-btn is-primary" href="#account">REDIĢĒT PROFILU ↗</a>' : ''
    }`
    document.querySelector('#profile-share-btn')?.addEventListener('click', async (event) => {
      const btn = event.currentTarget
      try {
        await navigator.clipboard.writeText(window.location.href)
        btn.textContent = '✓ SAITE NOKOPĒTA'
        showToast('Profila saite nokopēta starpliktuvē.')
      } catch {
        showToast('Neizdevās nokopēt saiti.', { isWarning: true })
      }
      setTimeout(() => {
        btn.textContent = 'KOPĒT SAITI'
        if (isTranslated()) translatePage()
      }, 1800)
    })
  }

  // Trust badges
  const badgesEl = document.querySelector('#seller-badges')
  if (badgesEl) {
    const badges = []
    if (stats.count >= 2 && stats.average >= 4.5) {
      badges.push('<span class="profile-badge is-top">★ AUGSTI NOVĒRTĒTS</span>')
    } else if (activeListings.length > 0) {
      badges.push('<span class="profile-badge">AKTĪVS PĀRDEVĒJS</span>')
    }
    if (isOwnProfile) {
      badges.push('<span class="profile-badge is-own">TAVS PROFILS</span>')
    }
    badgesEl.innerHTML = badges.join('')
  }

  // Meta pills (City + Member since)
  const metaEl = document.querySelector('#seller-meta')
  if (metaEl) {
    const metaItems = []
    metaItems.push(`<span class="profile-meta-pill">${PIN_ICON_SVG}<span>${escapeHtml(profile?.city || 'Latvija')}</span></span>`)
    if (profile?.created_at) {
      const joined = new Date(profile.created_at).toLocaleDateString('lv-LV')
      metaItems.push(`<span class="profile-meta-pill">${CALENDAR_ICON_SVG}<span>Pievienojies</span> <span>${escapeHtml(joined)}</span></span>`)
    }
    metaEl.innerHTML = metaItems.join('')
  }

  // Top brands sold by this seller
  const brandsEl = document.querySelector('#seller-brands')
  if (brandsEl) {
    const topBrands = [...new Set(activeListings.map((l) => (l.brand || '').trim()).filter(Boolean))].slice(0, 5)
    brandsEl.innerHTML = topBrands.length
      ? topBrands.map((b) => `<span class="profile-brand-tag">${escapeHtml(b)}</span>`).join('')
      : ''
  }

  // Telemetry KPI strip
  document.querySelector('#kpi-rating').textContent = stats.count ? stats.average.toFixed(1) : '—'
  document.querySelector('#kpi-rating-stars').innerHTML = stats.count
    ? renderStarsSvg(stats.average, { size: 13 })
    : 'Vēl nav vērtējumu'
  document.querySelector('#kpi-reviews').textContent = String(stats.count)
  document.querySelector('#kpi-positive').innerHTML = stats.count
    ? `<span>${stats.positivePercent}%</span> <span>pozitīvas</span>`
    : 'Vēl nav atsauksmju'
  document.querySelector('#kpi-listings').textContent = String(activeListings.length)
  document.querySelector('#kpi-since').textContent = profile?.created_at
    ? String(new Date(profile.created_at).getFullYear())
    : '—'
  document.querySelector('#tab-count-listings').textContent = String(activeListings.length)
  document.querySelector('#tab-count-reviews').textContent = String(stats.count)

  // Tabs switching
  const listingsSection = document.querySelector('#profile-listings-section')
  const reviewsSection = document.querySelector('#profile-reviews-section')
  const setTab = (tabName, scroll = false) => {
    document.querySelectorAll('.profile-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.profileTab === tabName)
    })
    if (listingsSection) listingsSection.hidden = tabName === 'reviews'
    if (reviewsSection) reviewsSection.hidden = tabName === 'listings'
    if (scroll) {
      const target = tabName === 'reviews' ? reviewsSection : listingsSection
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  document.querySelectorAll('.profile-tab').forEach((btn) =>
    btn.addEventListener('click', () => setTab(btn.dataset.profileTab)),
  )
  document.querySelectorAll('[data-jump-tab]').forEach((btn) =>
    btn.addEventListener('click', () => setTab(btn.dataset.jumpTab, true)),
  )

  // Listings grid + seller inventory search
  const listingsHolder = document.querySelector('#seller-listings')
  const searchWrap = document.querySelector('#seller-listings-search-wrap')
  const searchInput = document.querySelector('#seller-listings-search')
  const emptyNotice = document.querySelector('#seller-listings-empty')
  if (activeListings.length) {
    listingsHolder.innerHTML = sellerListingCardsMarkup(activeListings, thumbs)
    if (searchWrap) searchWrap.hidden = activeListings.length < 2
    if (searchInput) {
      searchInput.oninput = () => {
        const q = searchInput.value.trim().toLowerCase()
        let visible = 0
        listingsHolder.querySelectorAll('.profile-listing-card').forEach((card) => {
          const ok = !q || (card.dataset.sellerSearch || '').includes(q)
          card.hidden = !ok
          if (ok) visible += 1
        })
        if (emptyNotice) emptyNotice.hidden = visible !== 0
      }
    }
  } else {
    if (searchWrap) searchWrap.hidden = true
    listingsHolder.innerHTML =
      '<div class="profile-empty-state"><p>Šim pārdevējam pašlaik nav aktīvu sludinājumu.</p></div>'
  }

  // Interactive Rating Summary + Sortable/Filterable Reviews Feed
  let activeStarFilter = null
  let currentSort = 'newest'

  const summaryHolder = document.querySelector('#seller-rating-summary')
  const reviewsHolder = document.querySelector('#seller-reviews')
  const toolbar = document.querySelector('#seller-reviews-toolbar')
  const countEl = document.querySelector('#reviews-visible-count')
  const clearChip = document.querySelector('#reviews-clear-filter')
  const sortSelect = document.querySelector('#reviews-sort-select')

  const renderReviewsState = () => {
    if (summaryHolder) {
      summaryHolder.innerHTML = ratingSummaryMarkup(stats, activeStarFilter)
      summaryHolder.querySelectorAll('[data-filter-star]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const star = Number(btn.dataset.filterStar)
          activeStarFilter = activeStarFilter === star ? null : star
          renderReviewsState()
        }),
      )
    }

    let filtered = activeStarFilter
      ? allReviews.filter((r) => Math.round(Number(r.rating)) === activeStarFilter)
      : [...allReviews]

    if (currentSort === 'highest') {
      filtered.sort((a, b) => Number(b.rating) - Number(a.rating) || new Date(b.created_at) - new Date(a.created_at))
    } else if (currentSort === 'lowest') {
      filtered.sort((a, b) => Number(a.rating) - Number(b.rating) || new Date(b.created_at) - new Date(a.created_at))
    } else {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    if (toolbar) toolbar.hidden = allReviews.length === 0
    if (countEl) {
      countEl.innerHTML = `<span>${filtered.length}</span> <span>${filtered.length === 1 ? 'atsauksme' : 'atsauksmes'}</span>`
    }
    if (clearChip) {
      clearChip.hidden = !activeStarFilter
      if (activeStarFilter) clearChip.innerHTML = `<span>Tikai</span> ${activeStarFilter} ★ ×`
    }

    if (reviewsHolder) {
      reviewsHolder.innerHTML = filtered.length
        ? reviewCardsMarkup(filtered, reviewerMap, user?.id)
        : activeStarFilter
          ? '<div class="profile-empty-state"><p>Nav atsauksmju ar šo vērtējumu.</p></div>'
          : '<div class="profile-empty-state"><p>Vēl nav nevienas atsauksmes.</p></div>'
    }
    if (isTranslated()) translatePage()
  }

  if (clearChip) {
    clearChip.onclick = () => {
      activeStarFilter = null
      renderReviewsState()
    }
  }
  if (sortSelect) {
    sortSelect.onchange = () => {
      currentSort = sortSelect.value
      renderReviewsState()
    }
    enhanceSelects(toolbar)
  }
  renderReviewsState()

  // Review Form / Prompt Card
  const formHolder = document.querySelector('#seller-review-form-holder')
  if (!user) {
    formHolder.innerHTML = `<div class="profile-review-card-head">
        <div class="section-kicker">ATSTĀT ATSAUKSMI</div>
        <h3>Dalies ar pieredzi</h3>
        <p class="profile-review-hint">Pieslēdzies savam kontam, lai novērtētu šo pārdevēju.</p>
      </div>
      <div class="review-login-prompt">
        <button class="button button-dark" id="seller-review-login" type="button">IELOGOTIES, LAI ATSTĀTU ATSAUKSMI ↗</button>
      </div>`
    document.querySelector('#seller-review-login')?.addEventListener('click', () => {
      if (openAuthModal) openAuthModal('login')
      else window.location.hash = 'account'
    })
  } else if (isOwnProfile) {
    formHolder.innerHTML = `<div class="profile-review-card-head">
        <div class="section-kicker">TAVS PUBLISKAIS PROFILS</div>
        <h3>Tā tevi redz pircēji</h3>
        <p class="profile-review-hint">Vari atjaunot savu vārdu, pilsētu un sludinājumus sava konta iestatījumos.</p>
      </div>
      <div class="review-login-prompt">
        <a class="button button-dark" href="#account">ATVĒRT MANU KONTU ↗</a>
      </div>`
  } else {
    formHolder.innerHTML = reviewFormMarkup(allReviews.find((r) => r.reviewer_id === user.id))
    bindReviewForm(id, user.id, openAuthModal)
  }

  primeAndTranslate()
}

export function bindSellForm(route, openAuthModal) {
  if (!supabase) return
  const listingForm = document.querySelector('#listing-form')
  if (listingForm) {
    listingForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      await withSubmitLock(listingForm, async () => {
        const message = document.querySelector('#listing-message')
        const formData = new FormData(listingForm)
        if (isSpamSubmit(formData)) return
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          message.textContent = 'Lai ievietotu sludinājumu, vispirms ielogojies.'
          openAuthModal('login')
          return
        }
        const { valid: files, error: fileError } = validateImageFiles(formData.getAll('images'))
        if (fileError) {
          message.textContent = fileError
          return
        }
        const { data: listing, error } = await supabase
          .from('listings')
          .insert({
            user_id: user.id,
            title: formData.get('title'),
            price: Number(formData.get('price')),
            oem_number: formData.get('oem_number'),
            brand: formData.get('brand'),
            model: formData.get('model'),
            production_year: Number(formData.get('production_year')) || null,
            engine: formData.get('engine'),
            category: formData.get('category'),
            location: formData.get('location'),
            condition: formData.get('condition'),
            description: formData.get('description'),
            status: 'active',
          })
          .select()
          .single()
        if (error) {
          message.textContent = error.message
          return
        }
        if (files.length) {
          message.textContent = `Augšupielādē ${files.length} ${files.length === 1 ? 'bildi' : 'bildes'}...`
        }
        const uploadResults = await Promise.all(
          files.map(async (file, index) => {
            const safeName = sanitizeUploadFilename(file.name, index)
            const path = `${user.id}/${listing.id}/${safeName}`
            const upload = await supabase.storage.from('listing-images').upload(path, file)
            if (upload.error) return upload.error
            const { error: metaError } = await supabase
              .from('listing_images')
              .insert({ listing_id: listing.id, storage_path: path, sort_order: index })
            if (metaError) return metaError
            return null
          }),
        )
        const uploadError = uploadResults.find(Boolean)
        message.textContent = uploadError
          ? `Sludinājums publicēts, bet bildes neizdevās augšupielādēt: ${uploadError.message}`
          : 'Sludinājums publicēts! Pārvaldi to savā kontā (Mans konts).'
        if (isTranslated()) translatePage()
        listingForm.reset()
      })
    })
  }
  if (route === 'sell') {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const msg = document.querySelector('#listing-message')
      if (!user && msg) msg.textContent = 'Ielogojies, lai publicētu sludinājumu.'
    })
  }
}
