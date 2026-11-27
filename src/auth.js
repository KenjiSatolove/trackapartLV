import { supabase } from './lib/supabase.js'
import {
  CATEGORIES,
  CONDITION_NAMES,
  LISTING_STATUS_NAMES,
  ORDER_STATUS_NAMES,
  SITE_URL,
} from './data.js'
import {
  escapeHtml,
  formatPrice,
  isSpamSubmit,
  qrCodeToImgSrc,
  safeUrl,
  sanitizeUploadFilename,
  validateImageFiles,
  withSubmitLock,
} from './utils.js'
import { isEnglish, primeAndTranslate, translatePage } from './i18n.js'
import { fetchListingThumbnails, listingThumbMarkup } from './listings.js'

let pendingAuthEvent = null

export function setPendingAuthEvent(val) {
  pendingAuthEvent = val
}

export function openAuthModal(mode) {
  const overlay = document.querySelector('#auth-modal-overlay')
  if (!overlay) return
  overlay.hidden = false
  setAuthModalTab(mode || 'login')
  setTimeout(() => document.querySelector('#auth-modal-overlay input[name="email"]')?.focus(), 50)
}

export function closeAuthModal() {
  const overlay = document.querySelector('#auth-modal-overlay')
  if (overlay) overlay.hidden = true
  const message = document.querySelector('#auth-modal-message')
  if (message) message.textContent = ''
  document.querySelector('#auth-modal-form')?.reset()
}

export function closeMfaModal() {
  const overlay = document.querySelector('#mfa-modal-overlay')
  if (overlay) overlay.hidden = true
  const holder = document.querySelector('#mfa-modal-holder')
  if (holder) holder.innerHTML = ''
}

export async function cancelMfaModal() {
  closeMfaModal()
  if (supabase && (await accountHasPendingMfaChallenge())) {
    await supabase.auth.signOut()
  }
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
  if (isEnglish()) translatePage()
}

export function mfaCodeFormMarkup(idPrefix, submitLabel) {
  return `<form class="site-form" id="${escapeHtml(idPrefix)}-form">
    <label>KODS<input name="code" inputmode="numeric" pattern="[0-9]*" maxlength="6" required autocomplete="one-time-code"></label>
    <button class="button button-dark" type="submit">${escapeHtml(submitLabel)} ↗</button>
    <p class="form-message" id="${escapeHtml(idPrefix)}-message"></p>
  </form>`
}

export function renderMfaChallenge(container, idPrefix, factorId, onVerified) {
  container.innerHTML = mfaCodeFormMarkup(idPrefix, 'APSTIPRINĀT')
  document.querySelector(`#${idPrefix}-form`).addEventListener('submit', async (event) => {
    event.preventDefault()
    const code = new FormData(event.target).get('code')
    const message = document.querySelector(`#${idPrefix}-message`)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (error) {
      message.textContent = error.message
      return
    }
    onVerified()
  })
}

export async function renderMfaEnroll(container, idPrefix, onEnrolled) {
  const { data: existingFactors } = await supabase.auth.mfa.listFactors()
  const staleFactors = (existingFactors?.all || []).filter(
    (f) => f.factor_type === 'totp' && f.status === 'unverified',
  )
  for (const stale of staleFactors) await supabase.auth.mfa.unenroll({ factorId: stale.id })
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error || !data?.totp?.qr_code || !data.totp.secret) {
    container.innerHTML = `<p class="form-message">${escapeHtml(error?.message || 'Neizdevās sagatavot 2FA iestatīšanu. Mēģini vēlreiz.')}</p>`
    return
  }
  const { id: factorId, totp } = data
  const qrSrc = escapeHtml(qrCodeToImgSrc(totp.qr_code))
  container.innerHTML = `<div class="mfa-qr"><img src="${qrSrc}" alt="QR kods" width="200" height="200"></div>
    <p class="admin-note">Atslēga: <code>${escapeHtml(totp.secret)}</code></p>
    ${mfaCodeFormMarkup(idPrefix, 'AKTIVIZĒT')}`
  document.querySelector(`#${idPrefix}-form`).addEventListener('submit', async (event) => {
    event.preventDefault()
    const code = new FormData(event.target).get('code')
    const message = document.querySelector(`#${idPrefix}-message`)
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (verifyError) {
      message.textContent = verifyError.message
      return
    }
    onEnrolled()
  })
}

async function accountHasPendingMfaChallenge() {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  return aal?.nextLevel === 'aal2' && aal.currentLevel !== aal.nextLevel
}

export async function challengeMfaIfNeeded(onDone) {
  if (!(await accountHasPendingMfaChallenge())) {
    onDone()
    return
  }
  const { data: factorsData } = await supabase.auth.mfa.listFactors()
  const factor = (factorsData?.totp || [])[0]
  if (!factor) {
    onDone()
    return
  }
  const overlay = document.querySelector('#mfa-modal-overlay')
  overlay.hidden = false
  renderMfaChallenge(document.querySelector('#mfa-modal-holder'), 'mfa-modal', factor.id, () => {
    overlay.hidden = true
    onDone()
  })
  document.querySelector('#mfa-modal-cancel').onclick = () => cancelMfaModal()
}

export function bindAuthModal(onSignedIn) {
  if (!supabase) return
  document.querySelector('#auth-modal-close')?.addEventListener('click', closeAuthModal)
  document.querySelector('#auth-modal-overlay')?.addEventListener('click', (event) => {
    if (event.target.id === 'auth-modal-overlay') closeAuthModal()
  })
  document.querySelectorAll('.auth-tab').forEach((tab) =>
    tab.addEventListener('click', () => setAuthModalTab(tab.dataset.authTab)),
  )
  document.querySelector('#auth-modal-forgot')?.addEventListener('click', async () => {
    const email = new FormData(document.querySelector('#auth-modal-form')).get('email')
    const message = document.querySelector('#auth-modal-message')
    if (!email) {
      message.textContent = 'Ievadi e-pastu, lai atjaunotu paroli.'
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}#account` })
    message.textContent = error ? error.message : 'Paroles atjaunošanas saite nosūtīta uz e-pastu.'
  })
  document.querySelector('#auth-modal-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.target
    await withSubmitLock(form, async () => {
      const data = new FormData(form)
      const message = document.querySelector('#auth-modal-message')
      if (isSpamSubmit(data)) return
      if (!data.get('email') || !data.get('password')) {
        message.textContent = 'Ievadi e-pastu un paroli.'
        return
      }
      if (form.dataset.mode === 'signup') {
        if (!data.get('consent')) {
          message.textContent = 'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.'
          return
        }
        const { error } = await supabase.auth.signUp({
          email: data.get('email'),
          password: data.get('password'),
          options: { emailRedirectTo: `${SITE_URL}#account` },
        })
        message.textContent = error
          ? error.message
          : 'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.'
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.get('email'),
          password: data.get('password'),
        })
        if (error) {
          message.textContent = error.message
          return
        }
        await challengeMfaIfNeeded(() => {
          closeAuthModal()
          window.location.hash = 'account'
          onSignedIn?.()
        })
      }
    })
  })
}

export function bindAccountAuthForm(onSignedIn) {
  if (!supabase) return
  const authForm = document.querySelector('#auth-form')
  const authMessage = document.querySelector('#auth-message')
  if (!authForm) return
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    await withSubmitLock(authForm, async () => {
      const data = new FormData(authForm)
      if (isSpamSubmit(data)) return
      if (!data.get('email') || !data.get('password')) {
        authMessage.textContent = 'Ievadi e-pastu un paroli.'
        return
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: data.get('email'),
        password: data.get('password'),
      })
      if (error) {
        authMessage.textContent = error.message
        return
      }
      authMessage.textContent = 'Veiksmīgi ielogojies.'
      await challengeMfaIfNeeded(() => {
        onSignedIn?.()
      })
    })
  })
  document.querySelector('#signup-button')?.addEventListener('click', async () => {
    const data = new FormData(authForm)
    if (isSpamSubmit(data)) return
    if (!data.get('email') || !data.get('password')) {
      authMessage.textContent = 'Ievadi e-pastu un paroli, lai izveidotu kontu.'
      return
    }
    if (!data.get('consent')) {
      authMessage.textContent = 'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.'
      return
    }
    const { error } = await supabase.auth.signUp({
      email: data.get('email'),
      password: data.get('password'),
      options: { emailRedirectTo: `${SITE_URL}#account` },
    })
    authMessage.textContent = error
      ? error.message
      : 'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.'
  })
  document.querySelector('#forgot-password')?.addEventListener('click', async () => {
    const email = new FormData(authForm).get('email')
    if (!email) {
      authMessage.textContent = 'Ievadi e-pastu, lai atjaunotu paroli.'
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}#account` })
    authMessage.textContent = error ? error.message : 'Paroles atjaunošanas saite nosūtīta uz e-pastu.'
  })
}

function recoveryFormMarkup() {
  return `<div class="section-kicker">JAUNA PAROLE</div>
    <h2>Uzstādi <em>jaunu paroli.</em></h2>
    <form id="recovery-form" class="site-form">
      <label>JAUNĀ PAROLE<input name="password" type="password" minlength="6" required></label>
      <div class="form-actions"><button class="button button-dark" type="submit">SAGLABĀT PAROLI ↗</button></div>
      <p class="form-message" id="recovery-message"></p>
    </form>`
}

function myListingFormMarkup(listing, existingImages) {
  const l = listing || {}
  const images = (existingImages || [])
    .map((img) => ({ ...img, url: safeUrl(img.url) }))
    .filter((img) => img.url)
  return `<form class="admin-product-form" id="my-listing-form">
    <h3>Rediģēt sludinājumu</h3>
    <input type="hidden" name="id" value="${escapeHtml(l.id)}">
    <label>NOSAUKUMS<input name="title" required maxlength="120" value="${escapeHtml(l.title || '')}"></label>
    <div class="form-two">
      <label>CENA (€)<input name="price" type="number" min="0" step="0.01" required value="${escapeHtml(l.price ?? '')}"></label>
      <label>OEM NUMURS<input name="oem_number" maxlength="60" value="${escapeHtml(l.oem_number || '')}"></label>
    </div>
    <div class="form-two">
      <label>MARKA<input name="brand" maxlength="50" value="${escapeHtml(l.brand || '')}"></label>
      <label>MODELIS<input name="model" maxlength="60" value="${escapeHtml(l.model || '')}"></label>
    </div>
    <div class="form-two">
      <label>GADS<input name="production_year" type="number" min="1950" max="2030" value="${escapeHtml(l.production_year || '')}"></label>
      <label>DZINĒJS<input name="engine" maxlength="60" value="${escapeHtml(l.engine || '')}"></label>
    </div>
    <div class="form-two">
      <label>KATEGORIJA<select name="category">${CATEGORIES.map(
        (c) => `<option ${l.category === c[4] ? 'selected' : ''}>${escapeHtml(c[4])}</option>`,
      ).join('')}</select></label>
      <label>ATRAŠANĀS VIETA<input name="location" maxlength="80" value="${escapeHtml(l.location || '')}"></label>
    </div>
    <label>STĀVOKLIS<select name="condition">
      <option value="very_good" ${l.condition === 'very_good' ? 'selected' : ''}>Ļoti labs</option>
      <option value="good" ${l.condition === 'good' ? 'selected' : ''}>Labs</option>
      <option value="defect" ${l.condition === 'defect' ? 'selected' : ''}>Ar defektu</option>
    </select></label>
    <label>APRAKSTS<textarea name="description" rows="4" maxlength="2000">${escapeHtml(l.description || '')}</textarea></label>
    ${
      images.length
        ? `<label>ESOŠĀS BILDES<div class="admin-listing-images">${images
            .map(
              (img) => `<div class="editable-image-tile" data-image-tile="${escapeHtml(img.id)}">
                <img src="${escapeHtml(img.url)}" alt="">
                <button class="editable-image-remove" type="button" data-remove-image-id="${escapeHtml(img.id)}" data-remove-image-path="${escapeHtml(img.storage_path)}" aria-label="Dzēst bildi">×</button>
              </div>`,
            )
            .join('')}</div></label>`
        : ''
    }
    <label>PIEVIENOT BILDES<input name="images" type="file" accept="image/*" multiple></label>
    <div class="form-actions">
      <button class="button button-dark" type="submit">SAGLABĀT ↗</button>
      <button class="text-button" type="button" id="my-listing-cancel">ATCELT</button>
    </div>
    <p class="admin-note" id="my-listing-message"></p>
  </form>`
}

async function bindMyListingForm(listing, userId) {
  const holder = document.querySelector('#my-listing-form-holder')
  if (!holder) return
  let existingImages = []
  if (listing) {
    const { data: images } = await supabase
      .from('listing_images')
      .select('id, storage_path')
      .eq('listing_id', listing.id)
      .order('sort_order')
    existingImages = (images || []).map((image) => ({
      id: image.id,
      storage_path: image.storage_path,
      url: supabase.storage.from('listing-images').getPublicUrl(image.storage_path).data.publicUrl,
    }))
  }
  holder.innerHTML = myListingFormMarkup(listing, existingImages)
  document.querySelector('#my-listing-cancel')?.addEventListener('click', () => {
    holder.innerHTML = ''
  })
  holder.querySelectorAll('[data-remove-image-id]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const message = document.querySelector('#my-listing-message')
      const imageId = btn.dataset.removeImageId
      const storagePath = btn.dataset.removeImagePath
      btn.disabled = true
      const { error } = await supabase.from('listing_images').delete().eq('id', imageId)
      if (error) {
        btn.disabled = false
        if (message) message.textContent = error.message
        return
      }
      if (storagePath) {
        await supabase.storage.from('listing-images').remove([storagePath])
      }
      existingImages = existingImages.filter((img) => String(img.id) !== String(imageId))
      btn.closest('.editable-image-tile')?.remove()
    }),
  )
  const form = document.querySelector('#my-listing-form')
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    await withSubmitLock(form, async () => {
      const message = document.querySelector('#my-listing-message')
      const data = new FormData(form)
      const { valid: files, error: fileError } = validateImageFiles(data.getAll('images'), {
        existingCount: existingImages.length,
      })
      if (fileError) {
        message.textContent = fileError
        return
      }
      const listingId = data.get('id')
      const row = {
        title: data.get('title'),
        price: Number(data.get('price')),
        oem_number: data.get('oem_number'),
        brand: data.get('brand'),
        model: data.get('model'),
        production_year: Number(data.get('production_year')) || null,
        engine: data.get('engine'),
        category: data.get('category'),
        location: data.get('location'),
        condition: data.get('condition'),
        description: data.get('description'),
      }
      const { error } = await supabase.from('listings').update(row).eq('id', listingId).eq('user_id', userId)
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
          const path = `${userId}/${listingId}/${safeName}`
          const upload = await supabase.storage.from('listing-images').upload(path, file)
          if (upload.error) return upload.error
          const { error: metaError } = await supabase.from('listing_images').insert({
            listing_id: listingId,
            storage_path: path,
            sort_order: existingImages.length + index,
          })
          if (metaError) return metaError
          return null
        }),
      )
      const uploadError = uploadResults.find(Boolean)
      if (uploadError) {
        message.textContent = `Izmaiņas saglabātas, bet bildes neizdevās augšupielādēt: ${uploadError.message}`
        return
      }
      holder.innerHTML = ''
      await loadMyListings(userId)
    })
  })
}

async function loadMyListings(userId) {
  const holder = document.querySelector('#my-listings')
  if (!holder) return
  const { data: rows } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  holder.innerHTML = `<div id="my-listing-form-holder"></div><p class="form-message" id="my-listings-message"></p>${
    rows?.length
      ? `<div class="admin-table cols-5">
          <div class="admin-table-head"><span>SLUDINĀJUMS</span><span>AUTO</span><span>CENA</span><span>STATUSS</span><span>DARBĪBAS</span></div>
          ${rows
            .map(
              (row) => `<div class="admin-table-row">
                <strong>${escapeHtml(row.title)}</strong>
                <span>${escapeHtml(row.brand || '-')} ${escapeHtml(row.model || '')}</span>
                <b>${Number(row.price).toFixed(0)} €</b>
                <span class="status-pill">${escapeHtml(LISTING_STATUS_NAMES[row.status] || row.status)}</span>
                <span class="row-actions">
                  <button class="row-action" data-my-edit-id="${escapeHtml(row.id)}">Rediģēt</button>
                  <button class="row-action" data-my-remove-id="${escapeHtml(row.id)}">Dzēst</button>
                </span>
              </div>`,
            )
            .join('')}
        </div>`
      : '<p class="listing-loading">Tev vēl nav neviena sludinājuma.</p>'
  }`
  document.querySelectorAll('[data-my-edit-id]').forEach((button) =>
    button.addEventListener('click', () =>
      bindMyListingForm(
        rows.find((row) => row.id.toString() === button.dataset.myEditId),
        userId,
      ),
    ),
  )
  document.querySelectorAll('[data-my-remove-id]').forEach((button) =>
    button.addEventListener('click', async () => {
      if (!window.confirm('Dzēst šo sludinājumu?')) return
      const listingId = button.dataset.myRemoveId
      const { data: imgs } = await supabase
        .from('listing_images')
        .select('storage_path')
        .eq('listing_id', listingId)
      const { error } = await supabase.from('listings').delete().eq('id', listingId).eq('user_id', userId)
      if (error) {
        const msg = document.querySelector('#my-listings-message')
        if (msg) msg.textContent = error.message
        return
      }
      const paths = (imgs || []).map((img) => img.storage_path).filter(Boolean)
      if (paths.length) {
        await supabase.storage.from('listing-images').remove(paths)
      }
      await loadMyListings(userId)
    }),
  )
}

async function renderAccountSecurity(userId) {
  const holder = document.querySelector('#account-security')
  if (!holder) return
  const { data: factorsData } = await supabase.auth.mfa.listFactors()
  const factor = (factorsData?.totp || [])[0]
  if (factor) {
    holder.innerHTML = `<p class="detail-description">2FA ir ieslēgta šim kontam.</p>
      <button class="text-button" id="mfa-disable-button" type="button">IZSLĒGT 2FA</button>
      <p class="form-message" id="account-security-message"></p>`
    document.querySelector('#mfa-disable-button').addEventListener('click', async () => {
      const message = document.querySelector('#account-security-message')
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (error) {
        message.textContent = error.message
        return
      }
      renderAccountSecurity(userId)
    })
  } else {
    holder.innerHTML = `<p class="detail-description">2FA nav ieslēgta šim kontam. Ieteicams pārdevējiem, lai pasargātu kontu no pārņemšanas.</p>
      <button class="button button-dark" id="mfa-enable-button" type="button">IESLĒGT 2FA</button>`
    document.querySelector('#mfa-enable-button').addEventListener('click', async () => {
      await renderMfaEnroll(holder, 'account-security-enroll', () => renderAccountSecurity(userId))
    })
  }
}

async function loadMyOrders(userId) {
  const holder = document.querySelector('#my-orders')
  if (!holder) return
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    holder.innerHTML = '<p class="listing-loading">Pasūtījumu vēsture vēl nav pieejama.</p>'
    return
  }
  if (!orders?.length) {
    holder.innerHTML = '<p class="listing-loading">Tev vēl nav neviena pasūtījuma.</p>'
    return
  }
  const { data: items } = await supabase
    .from('order_items')
    .select('order_id, product_name, quantity')
    .in(
      'order_id',
      orders.map((o) => o.id),
    )
  const itemsByOrder = {}
  items?.forEach((item) => {
    const label = item.quantity > 1 ? `${item.product_name} ×${item.quantity}` : item.product_name
    ;(itemsByOrder[item.order_id] ??= []).push(label)
  })
  holder.innerHTML = `<div class="admin-table cols-5">
    <div class="admin-table-head"><span>PASŪTĪJUMS</span><span>PRECES</span><span>DATUMS</span><span>SUMMA</span><span>STATUSS</span></div>
    ${orders
      .map(
        (order) => `<div class="admin-table-row">
          <code>#${escapeHtml(order.id)}</code>
          <span>${escapeHtml((itemsByOrder[order.id] || []).join(', ') || '-')}</span>
          <span>${new Date(order.created_at).toLocaleDateString('lv-LV')}</span>
          <b>${formatPrice(order.total)}</b>
          <span class="status-pill">${escapeHtml(ORDER_STATUS_NAMES[order.status] || order.status)}</span>
        </div>`,
      )
      .join('')}
  </div>`
}

async function loadMyFavorites(userId) {
  const holder = document.querySelector('#my-favorites')
  if (!holder) return
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    holder.innerHTML = '<p class="listing-loading">Favorīti vēl nav pieejami.</p>'
    return
  }
  if (!favorites?.length) {
    holder.innerHTML = '<p class="listing-loading">Tev vēl nav neviena saglabāta sludinājuma.</p>'
    return
  }
  const { data: rows } = await supabase
    .from('listings')
    .select('id, title, brand, model, price, condition, status')
    .in(
      'id',
      favorites.map((f) => f.listing_id),
    )
  const active = (rows || []).filter((row) => row.status !== 'removed')
  const thumbs = await fetchListingThumbnails(active)
  holder.innerHTML = active.length
    ? `<div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div>${active
        .map(
          (row) => `<a class="listing-row" href="#listing-${escapeHtml(row.id)}">
            <div class="listing-title-cell">${listingThumbMarkup(thumbs[row.id])}<strong>${escapeHtml(row.title)}</strong></div>
            <span>${escapeHtml(row.brand || '-')} ${escapeHtml(row.model || '')}</span>
            <span>${escapeHtml(CONDITION_NAMES[row.condition] || row.condition || 'Nav norādīts')}</span>
            <b>${formatPrice(row.price)}</b>
            <span class="listing-arrow">↗</span>
          </a>`,
        )
        .join('')}`
    : '<p class="listing-loading">Tev vēl nav neviena saglabāta sludinājuma.</p>'
  primeAndTranslate()
}

export async function initAccountPage(onSignOut) {
  const holder = document.querySelector('#account-content')
  if (!holder || !supabase) return
  if (pendingAuthEvent === 'recovery') {
    holder.innerHTML = recoveryFormMarkup()
    const recoveryForm = document.querySelector('#recovery-form')
    recoveryForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      await withSubmitLock(recoveryForm, async () => {
        const password = new FormData(recoveryForm).get('password')
        const { error } = await supabase.auth.updateUser({ password })
        document.querySelector('#recovery-message').textContent = error
          ? error.message
          : 'Parole atjaunota! Tagad vari izmantot jauno paroli.'
        if (!error) {
          pendingAuthEvent = null
          setTimeout(() => initAccountPage(onSignOut), 1500)
        }
      })
    })
    return
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  if (await accountHasPendingMfaChallenge()) {
    await challengeMfaIfNeeded(() => initAccountPage(onSignOut))
    return
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone, city, username')
    .eq('id', user.id)
    .single()
  const confirmedBanner =
    pendingAuthEvent === 'confirmed' ? '<p class="form-message">E-pasts apstiprināts — tu esi ielogojies!</p>' : ''
  pendingAuthEvent = null
  holder.innerHTML = `
    <div class="section-kicker">LIETOTĀJA PIEKĻUVE</div>
    <h2>Sveiks, <em id="account-greeting-name">${escapeHtml(profile?.display_name || user.email)}!</em></h2>
    ${confirmedBanner}
    <p><span>Tu esi ielogojies kā</span> <b>${escapeHtml(user.email)}</b>.</p>
    <form class="site-form" id="profile-form">
      <label>VĀRDS<input name="display_name" maxlength="80" value="${escapeHtml(profile?.display_name || '')}"></label>
      <div class="form-two">
        <label>TĀLRUNIS<input name="phone" maxlength="30" value="${escapeHtml(profile?.phone || '')}"></label>
        <label>PILSĒTA<input name="city" maxlength="60" value="${escapeHtml(profile?.city || '')}"></label>
      </div>
      <label>LIETOTĀJVĀRDS<input name="username" maxlength="40" value="${escapeHtml(profile?.username || '')}"></label>
      <div class="form-actions"><button class="button button-dark" type="submit">SAGLABĀT IZMAIŅAS ↗</button></div>
      <p class="form-message" id="profile-message"></p>
    </form>
    <div class="form-actions">
      <a class="button button-dark" href="#sell">PĀRDOT DETAĻU ↗</a>
      <a class="text-button" href="#seller-${escapeHtml(user.id)}">SKATĪT MANU PROFILU ↗</a>
      <button class="text-button" id="logout-button" type="button">IZIET</button>
    </div>
    <div class="section-kicker">DROŠĪBA</div>
    <h2>Divfaktoru <em>autentifikācija.</em></h2>
    <div id="account-security"><p class="listing-loading">Ielādējam...</p></div>
    <div class="section-kicker">MANI SLUDINĀJUMI</div>
    <h2>Tavi <em>sludinājumi.</em></h2>
    <div id="my-listings"><p class="listing-loading">Ielādējam sludinājumus...</p></div>
    <div class="section-kicker">MANI PASŪTĪJUMI</div>
    <h2>Pasūtījumu <em>vēsture.</em></h2>
    <div id="my-orders"><p class="listing-loading">Ielādējam pasūtījumus...</p></div>
    <div class="section-kicker">SAGLABĀTIE SLUDINĀJUMI</div>
    <h2>Tavi <em>favorīti.</em></h2>
    <div id="my-favorites"><p class="listing-loading">Ielādējam...</p></div>
    <div class="section-kicker">BĪSTAMĀ ZONA</div>
    <h2>Dzēst <em>kontu.</em></h2>
    <div class="danger-zone">
      <p class="detail-description">Konta dzēšana ir neatgriezeniska. Tiks dzēsti tavi sludinājumi, favorīti un profils.</p>
      <button class="danger-button" id="delete-account-button" type="button">DZĒST KONTU</button>
      <p class="form-message" id="delete-account-message"></p>
    </div>`

  document.querySelector('#logout-button').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.hash = 'home'
    onSignOut?.()
  })
  const profileForm = document.querySelector('#profile-form')
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    await withSubmitLock(profileForm, async () => {
      const message = document.querySelector('#profile-message')
      const data = new FormData(profileForm)
      const displayName = String(data.get('display_name') || '').trim()
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          phone: String(data.get('phone') || '').trim(),
          city: String(data.get('city') || '').trim(),
          username: String(data.get('username') || '').trim() || null,
        })
        .eq('id', user.id)
      if (error) {
        const isDuplicateUsername =
          error.code === '23505' || String(error.message || '').includes('profiles_username_key')
        message.textContent = isDuplicateUsername
          ? 'Šis lietotājvārds jau ir aizņemts. Izvēlies citu.'
          : error.message
        if (isEnglish()) translatePage()
        return
      }
      const greetingEl = document.querySelector('#account-greeting-name')
      if (greetingEl) greetingEl.textContent = `${displayName || user.email}!`
      message.textContent = 'Profils saglabāts.'
      if (isEnglish()) translatePage()
    })
  })
  document.querySelector('#delete-account-button').addEventListener('click', async () => {
    const message = document.querySelector('#delete-account-message')
    if (!window.confirm('Tiešām dzēst kontu? Šo darbību nevar atsaukt.')) return
    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      message.textContent = error.message
      return
    }
    await supabase.auth.signOut()
    window.location.hash = 'home'
    onSignOut?.()
  })
  await renderAccountSecurity(user.id)
  await loadMyListings(user.id)
  await loadMyOrders(user.id)
  await loadMyFavorites(user.id)
  if (isEnglish()) translatePage()
}
