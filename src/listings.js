import { supabase } from './lib/supabase.js'
import { CONDITION_NAMES, FALLBACK_LISTINGS } from './data.js'
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
import { isEnglish, primeAndTranslate, translatePage } from './i18n.js'
import { bindGallery, galleryMarkup } from './catalog.js'

export const listingsPage = `<section class="page-hero">
  <div class="section-kicker">04 / KOPIENAS TIRGUS</div>
  <h1>Redzi, ko citi<br><em>pārdod.</em></h1>
  <p>Īstas detaļas no TrackParts kopienas. Atver sludinājumu, lai redzētu pārdevēju un sazinātos.</p>
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
      <a id="detail-phone" class="seller-contact" href="mailto:hello@trackparts.lv">SAZINĀTIES ↗</a>
      <a class="seller-contact" href="mailto:hello@trackparts.lv">RAKSTĪT E-PASTU ↗</a>
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

export const sellerProfilePage = `<section class="page-hero">
  <a class="back-link" href="#listings">← ATPAKAĻ UZ SLUDINĀJUMIEM</a>
  <div class="section-kicker">PĀRDEVĒJA PROFILS</div>
  <h1 id="seller-name">Ielādē...</h1>
  <p id="seller-meta" class="detail-description"></p>
</section>
<section class="listings-section reveal">
  <div class="section-top">
    <div>
      <div class="section-kicker">AKTĪVIE SLUDINĀJUMI</div>
      <h2>Pārdevēja <em>sludinājumi.</em></h2>
    </div>
  </div>
  <div class="listing-table" id="seller-listings"><p class="listing-loading">Ielādējam...</p></div>
</section>
<section class="listings-section reveal">
  <div class="section-top">
    <div>
      <div class="section-kicker">ATSAUKSMES</div>
      <h2>Ko saka <em>pircēji.</em></h2>
    </div>
  </div>
  <div id="seller-review-form-holder"></div>
  <div class="reviews-list" id="seller-reviews"><p class="listing-loading">Ielādējam...</p></div>
</section>`

export async function fetchListingThumbnails(rows) {
  const thumbs = {}
  const realIds = []
  rows.forEach((row) => {
    if (row.images?.length) thumbs[row.id] = row.images[0]
    else if (row.id && !row.id.toString().startsWith('demo-')) realIds.push(row.id)
  })
  if (supabase && realIds.length) {
    const { data } = await supabase
      .from('listing_images')
      .select('listing_id, storage_path')
      .in('listing_id', realIds)
      .order('sort_order')
    ;(data || []).forEach((img) => {
      if (!thumbs[img.listing_id]) {
        thumbs[img.listing_id] = supabase.storage.from('listing-images').getPublicUrl(img.storage_path).data.publicUrl
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
      (row, index) =>
        `<a class="listing-row" data-search="${escapeHtml([row.title, row.brand, row.model, row.location, row.oem_number].filter(Boolean).join(' ').toLowerCase())}" href="#listing-${escapeHtml(row.id || `demo-${index + 1}`)}">
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
  let rows = FALLBACK_LISTINGS
  if (supabase) {
    const { data } = await supabase
      .from('listings')
      .select('id, title, brand, model, condition, price, location, oem_number')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(isFullPage ? 50 : 8)
    if (data?.length) rows = data
  }
  const thumbs = await fetchListingThumbnails(rows)
  const html = listingRowsMarkup(rows, thumbs)
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
  let rows = FALLBACK_LISTINGS.filter((row) => row.category?.toLowerCase() === categoryValue)
  if (supabase) {
    const { data } = await supabase
      .from('listings')
      .select('id, title, brand, model, condition, price, location, category, oem_number')
      .eq('status', 'active')
      .ilike('category', escapeIlikePattern(categoryValue))
      .order('created_at', { ascending: false })
      .limit(8)
    if (data?.length) rows = data
  }
  const thumbs = await fetchListingThumbnails(rows)
  target.innerHTML = rows.length
    ? listingRowsMarkup(rows, thumbs)
    : '<p class="listing-loading">Šajā kategorijā pašlaik nav aktīvu sludinājumu.</p>'
  primeAndTranslate()
}

async function bindFavoriteToggle(listing, openAuthModal) {
  const button = document.querySelector('#detail-favorite')
  if (!button) return
  if (!supabase || listing.id.toString().startsWith('demo-')) {
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
    if (isEnglish()) translatePage()
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
  if (!supabase || listing.id.toString().startsWith('demo-')) {
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
        if (isEnglish()) translatePage()
        return
      }
      message.textContent = 'Paldies! Ziņojums nosūtīts administrācijai.'
      if (isEnglish()) translatePage()
      form.reset()
    })
  }
}

export async function loadListingDetail(id, openAuthModal) {
  let listing = FALLBACK_LISTINGS.find((item) => item.id === id)
  if (supabase && !listing) {
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
    if (isEnglish()) translatePage()
    return
  }
  let images = listing.images || []
  if (supabase && !listing.id.toString().startsWith('demo-')) {
    const { data: imageRows } = await supabase
      .from('listing_images')
      .select('storage_path')
      .eq('listing_id', id)
      .order('sort_order')
    images = (imageRows || []).map(
      (row) => supabase.storage.from('listing-images').getPublicUrl(row.storage_path).data.publicUrl,
    )
  }
  if (!document.querySelector('#detail-gallery')) return
  document.querySelector('#detail-gallery').innerHTML = galleryMarkup(images, listing.title)
  bindGallery(document.querySelector('#detail-gallery'), images)
  document.querySelector('#detail-title').textContent = listing.title
  document.title = `${listing.title} — TrackParts`
  document.querySelector('#detail-description').textContent =
    listing.description || 'Pārdevējs nav pievienojis aprakstu.'
  document.querySelector('#detail-price').textContent = formatPrice(listing.price)
  document.querySelector('#detail-data').innerHTML = `
    <span>AUTO<strong>${escapeHtml(listing.brand || '-')} ${escapeHtml(listing.model || '')}</strong></span>
    <span>STĀVOKLIS<strong>${escapeHtml(CONDITION_NAMES[listing.condition] || listing.condition || 'Nav norādīts')}</strong></span>
    <span>ATRAŠANĀS VIETA<strong>${escapeHtml(listing.location || 'Nav norādīta')}</strong></span>`
  const sellerHeading = document.querySelector('#detail-seller')
  if (listing.user_id) {
    sellerHeading.innerHTML = `<a href="#seller-${escapeHtml(listing.user_id)}">${escapeHtml(listing.seller || 'Privāts pārdevējs')} ↗</a>`
  } else {
    sellerHeading.textContent = listing.seller || 'Privāts pārdevējs'
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

function reviewFormMarkup(existing) {
  return `<form class="site-form review-form" id="review-form">
    <label>VĒRTĒJUMS
      <div class="star-rating" id="star-rating" role="radiogroup" aria-label="Vērtējums">
        ${[1, 2, 3, 4, 5]
          .map(
            (n) =>
              `<button type="button" class="star-input" data-star="${n}" aria-label="Vērtēt ar ${n} no 5">★</button>`,
          )
          .join('')}
        <input type="hidden" name="rating" value="${existing?.rating || 0}">
      </div>
    </label>
    <label>KOMENTĀRS<textarea name="comment" rows="3" maxlength="1000" placeholder="Kā pagāja darījums?">${escapeHtml(existing?.comment || '')}</textarea></label>
    <div class="form-actions"><button class="button button-dark" type="submit">${existing ? 'ATJAUNOT ATSAUKSMI' : 'PUBLICĒT ATSAUKSMI'} ↗</button></div>
    <p class="form-message" id="review-message"></p>
  </form>`
}

function bindReviewForm(sellerId, reviewerId) {
  const form = document.querySelector('#review-form')
  if (!form) return
  const ratingInput = form.querySelector('input[name="rating"]')
  const paintStars = (n) =>
    form.querySelectorAll('.star-input').forEach((btn) => btn.classList.toggle('is-active', Number(btn.dataset.star) <= n))
  paintStars(Number(ratingInput.value))
  form.querySelectorAll('.star-input').forEach((btn) =>
    btn.addEventListener('click', () => {
      ratingInput.value = btn.dataset.star
      paintStars(Number(btn.dataset.star))
    }),
  )
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    await withSubmitLock(form, async () => {
      const message = document.querySelector('#review-message')
      const rating = Number(ratingInput.value)
      if (!rating) {
        message.textContent = 'Izvēlies vērtējumu.'
        if (isEnglish()) translatePage()
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
      await loadSellerProfile(sellerId)
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

export async function loadSellerProfile(id) {
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
      .select('id, title, brand, model, price, condition')
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
  const reviewers = publicProfiles.filter((p) => reviewerIds.includes(p.id))
  if (!document.querySelector('#seller-name')) return

  document.querySelector('#seller-name').textContent = profile?.display_name || 'Pārdevējs'
  document.title = `${profile?.display_name || 'Pārdevējs'} — TrackParts`
  const avg = reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  document.querySelector('#seller-meta').textContent = [
    profile?.city,
    reviews?.length ? `${avg.toFixed(1)} ★ (${reviews.length})` : 'Vēl nav atsauksmju',
    profile?.created_at ? `Pievienojies ${new Date(profile.created_at).toLocaleDateString('lv-LV')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  document.querySelector('#seller-listings').innerHTML = listings?.length
    ? listingRowsMarkup(listings, thumbs)
    : '<p class="listing-loading">Šim pārdevējam pašlaik nav aktīvu sludinājumu.</p>'

  const reviewsHolder = document.querySelector('#seller-reviews')
  if (reviews?.length) {
    const nameById = Object.fromEntries((reviewers || []).map((r) => [r.id, r.display_name]))
    reviewsHolder.innerHTML = reviews
      .map(
        (r) =>
          `<div class="review-row"><strong>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong><span>${escapeHtml(nameById[r.reviewer_id] || 'Lietotājs')} · ${new Date(r.created_at).toLocaleDateString('lv-LV')}</span>${r.comment ? `<p>${escapeHtml(r.comment)}</p>` : ''}</div>`,
      )
      .join('')
  } else {
    reviewsHolder.innerHTML = '<p class="listing-loading">Vēl nav nevienas atsauksmes.</p>'
  }

  const formHolder = document.querySelector('#seller-review-form-holder')
  if (!user) formHolder.innerHTML = '<p class="admin-note">Ielogojies, lai atstātu atsauksmi.</p>'
  else if (user.id === id) formHolder.innerHTML = ''
  else {
    formHolder.innerHTML = reviewFormMarkup(reviews?.find((r) => r.reviewer_id === user.id))
    bindReviewForm(id, user.id)
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
        if (isEnglish()) translatePage()
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
