import { supabase } from './lib/supabase.js'
import { CATEGORIES, CONDITION_NAMES, getProducts, loadProducts } from './data.js'
import {
  escapeHtml,
  formatPrice,
  notifyEmail,
  safeUrl,
  sanitizeUploadFilename,
  slugify,
  validateImageFiles,
  withSubmitLock,
} from './utils.js'
import { renderMfaChallenge, renderMfaEnroll } from './auth.js'
import { showToast } from './fx.js'
import { closeOpenSelect, enhanceSelects, syncSelect } from './selects.js'

const STAFF_ROLES = ['owner', 'manager', 'warehouse', 'fulfillment']
const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  warehouse: 'Warehouse',
  fulfillment: 'Fulfillment',
}
const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled']
const LISTING_FILTERS = ['active', 'pending', 'reserved', 'sold', 'removed', 'all']
const LOW_STOCK_THRESHOLD = 2

let currentAdminProfile = null
let activeTab = 'dashboard'

const tabState = {
  productQuery: '',
  productCategory: '',
  productStock: 'all', // all | in | low | out
  productSort: 'newest', // newest | price-asc | price-desc | stock-asc
  orderQuery: '',
  orderStatus: 'all',
  listingQuery: '',
  listingStatus: 'active',
}

export const adminPage = `<section class="admin-shell">
  <div class="admin-login" id="admin-login">
    <div class="admin-mark">TA / ADMIN</div>
    <div class="section-kicker">PRIVATE ACCESS</div>
    <h1>Admin<br><em>panel.</em></h1>
    <p>Sign in with a staff account to manage TrackApart.</p>
    <form class="site-form" id="admin-auth-form">
      <label>EMAIL<input name="email" type="email" required placeholder="owner@trackapart.lv"></label>
      <label>PASSWORD<input name="password" type="password" required></label>
      <button class="button button-dark" type="submit">SIGN IN ↗</button>
      <p class="form-message" id="admin-auth-message"></p>
    </form>
  </div>
  <div id="admin-dashboard" hidden></div>
</section>`

export function bindAdminPage() {
  if (!supabase) return
  const form = document.querySelector('#admin-auth-form')
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    await withSubmitLock(form, async () => {
      const data = new FormData(form)
      const message = document.querySelector('#admin-auth-message')
      const { error } = await supabase.auth.signInWithPassword({
        email: data.get('email'),
        password: data.get('password'),
      })
      if (error) {
        message.textContent = error.message
        return
      }
      await loadAdminDashboard()
    })
  })
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) loadAdminDashboard()
  })
}

async function showMfaChallenge(factor) {
  const loginPane = document.querySelector('#admin-login')
  if (!loginPane) return
  loginPane.innerHTML = `<div class="admin-mark">TA / ADMIN</div>
    <div class="section-kicker">TWO-FACTOR AUTHENTICATION</div>
    <h1>Enter<br><em>code.</em></h1>
    <p>Enter the 6-digit code from your authenticator app.</p>
    <div id="admin-mfa-holder"></div>`
  renderMfaChallenge(document.querySelector('#admin-mfa-holder'), 'admin-mfa', factor.id, () => loadAdminDashboard(), {
    codeLabel: 'CODE',
    submitLabel: 'VERIFY',
  })
}

async function showMfaEnroll() {
  const loginPane = document.querySelector('#admin-login')
  if (!loginPane) return
  loginPane.innerHTML = `<div class="admin-mark">TA / ADMIN</div>
    <div class="section-kicker">REQUIRED SETUP</div>
    <h1>Enable<br><em>two-factor auth.</em></h1>
    <p>2FA is required for staff accounts. Scan the QR code with your authenticator app (e.g. Google Authenticator, Authy) or enter the key manually.</p>
    <div id="admin-mfa-holder"></div>`
  await renderMfaEnroll(document.querySelector('#admin-mfa-holder'), 'admin-mfa-enroll', () => loadAdminDashboard(), {
    codeLabel: 'CODE',
    submitLabel: 'ENABLE 2FA',
    keyLabel: 'Key:',
    enrollError: 'Could not start 2FA setup. Please try again.',
  })
}

function ensureAdminDrawerMounted() {
  if (document.querySelector('#admin-drawer')) return
  const backdrop = document.createElement('div')
  backdrop.className = 'admin-drawer-backdrop'
  backdrop.id = 'admin-drawer-backdrop'
  const drawer = document.createElement('aside')
  drawer.className = 'admin-drawer'
  drawer.id = 'admin-drawer'
  drawer.setAttribute('role', 'dialog')
  drawer.setAttribute('aria-modal', 'true')
  drawer.setAttribute('aria-labelledby', 'admin-drawer-title')
  drawer.setAttribute('aria-hidden', 'true')
  drawer.innerHTML = `<div class="admin-drawer-header">
      <div>
        <span class="admin-overline" id="admin-drawer-subtitle"></span>
        <h3 id="admin-drawer-title"></h3>
      </div>
      <button class="admin-drawer-close" id="admin-drawer-close" type="button" aria-label="Close drawer">×</button>
    </div>
    <div class="admin-drawer-body" id="admin-drawer-body"></div>`
  document.body.append(backdrop, drawer)
  drawer.querySelector('#admin-drawer-close')?.addEventListener('click', closeAdminDrawer)
  backdrop.addEventListener('click', closeAdminDrawer)
}

function openAdminDrawer(title, subtitle, bodyHtml) {
  ensureAdminDrawerMounted()
  const backdrop = document.querySelector('#admin-drawer-backdrop')
  const drawer = document.querySelector('#admin-drawer')
  const titleEl = document.querySelector('#admin-drawer-title')
  const subEl = document.querySelector('#admin-drawer-subtitle')
  const bodyEl = document.querySelector('#admin-drawer-body')
  if (!drawer || !bodyEl) return
  if (titleEl) titleEl.textContent = title
  if (subEl) subEl.textContent = subtitle || ''
  bodyEl.innerHTML = bodyHtml
  bodyEl.scrollTop = 0
  enhanceSelects(bodyEl)
  drawer.setAttribute('aria-hidden', 'false')
  drawer.classList.add('is-open')
  backdrop?.classList.add('is-open')
}

export function closeAdminDrawer() {
  closeOpenSelect()
  const drawer = document.querySelector('#admin-drawer')
  drawer?.classList.remove('is-open')
  drawer?.setAttribute('aria-hidden', 'true')
  document.querySelector('#admin-drawer-backdrop')?.classList.remove('is-open')
}

function switchAdminTab(tab) {
  activeTab = tab
  document.querySelectorAll('.admin-tab').forEach((item) => {
    item.classList.toggle('active', item.dataset.tab === tab)
  })
  closeAdminDrawer()
  window.scrollTo({ top: 0, behavior: 'instant' })
  renderAdminTab(tab)
}

async function loadAdminDashboard() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, role')
    .eq('id', user.id)
    .single()
  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    const msg = document.querySelector('#admin-auth-message')
    if (msg) msg.textContent = 'This account does not have access to the admin panel.'
    await supabase.auth.signOut()
    return
  }
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.nextLevel !== 'aal2') {
    await showMfaEnroll()
    return
  }
  if (aal.currentLevel !== aal.nextLevel) {
    const { data: factorsData } = await supabase.auth.mfa.listFactors()
    const factor = (factorsData?.totp || []).find((f) => f.status === 'verified')
    if (!factor) {
      await showMfaEnroll()
      return
    }
    await showMfaChallenge(factor)
    return
  }

  currentAdminProfile = profile
  const loginPane = document.querySelector('#admin-login')
  if (loginPane) loginPane.hidden = true
  const dashboard = document.querySelector('#admin-dashboard')
  if (!dashboard) return
  dashboard.hidden = false
  const staffName = profile.display_name || profile.username || 'Staff'
  const roleLabel = ROLE_LABELS[profile.role] || profile.role || 'Staff'

  dashboard.innerHTML = `<div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-brand-bar">
        <div class="admin-logo"><span class="admin-logo-dot"></span><strong>TA / ADMIN</strong></div>
        <a class="admin-store-link" href="#home">Storefront ↗</a>
      </div>

      <div class="admin-nav-group">
        <span class="admin-nav-label">OPERATIONS</span>
        <button class="admin-tab active" data-tab="dashboard" type="button"><span class="admin-tab-icon">▦</span><span>Dashboard</span></button>
        <button class="admin-tab" data-tab="orders" type="button"><span class="admin-tab-icon">≡</span><span>Orders</span><b class="admin-badge" id="orders-badge" hidden>0</b></button>
      </div>

      <div class="admin-nav-group">
        <span class="admin-nav-label">CATALOG &amp; MARKET</span>
        <button class="admin-tab" data-tab="products" type="button"><span class="admin-tab-icon">▣</span><span>Products</span><b class="admin-badge is-neutral" id="products-badge">0</b></button>
        <button class="admin-tab" data-tab="listings" type="button"><span class="admin-tab-icon">◈</span><span>Listings</span><b class="admin-badge is-neutral" id="pending-badge">0</b></button>
        <button class="admin-tab" data-tab="reports" type="button"><span class="admin-tab-icon">⚑</span><span>Reports</span><b class="admin-badge" id="reports-badge" hidden>0</b></button>
      </div>

      <div class="admin-nav-group">
        <span class="admin-nav-label">SYSTEM</span>
        <button class="admin-tab" data-tab="tasks" type="button"><span class="admin-tab-icon">◎</span><span>Team</span></button>
        <button class="admin-tab" data-tab="settings" type="button"><span class="admin-tab-icon">⚙</span><span>Settings</span></button>
      </div>

      <div class="admin-sidebar-footer">
        <div class="admin-staff-chip">
          <strong>${escapeHtml(staffName)}</strong>
          <small>${escapeHtml(roleLabel)} · 2FA verified</small>
        </div>
        <button class="admin-logout" id="admin-logout" type="button">Log out</button>
      </div>
    </aside>

    <div class="admin-main">
      <div class="admin-topbar">
        <div class="admin-topbar-left">
          <span class="admin-topbar-date">${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div class="admin-topbar-actions">
          <button class="admin-ghost-btn" id="admin-refresh-btn" type="button" title="Refresh data">↻ Refresh</button>
          <button class="admin-action" id="admin-quick-add-product" type="button">+ Add product</button>
        </div>
      </div>
      <section class="admin-content" id="admin-content"></section>
    </div>
  </div>`

  ensureAdminDrawerMounted()

  document.querySelectorAll('.admin-tab').forEach((tab) =>
    tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab)),
  )
  document.querySelector('#admin-refresh-btn')?.addEventListener('click', async () => {
    await loadProducts()
    await renderAdminTab(activeTab)
    showToast('Admin data refreshed')
  })
  document.querySelector('#admin-quick-add-product')?.addEventListener('click', () => {
    openProductDrawer(null)
  })
  document.querySelector('#admin-logout')?.addEventListener('click', async () => {
    currentAdminProfile = null
    await supabase.auth.signOut()
    window.location.hash = 'home'
  })

  renderAdminTab('dashboard')
}

function adminProductFormMarkup(product, { isDuplicate = false } = {}) {
  const p = product || {}
  const initialImages = (p.images?.length ? p.images : [p.image].filter(Boolean))
    .map((url) => safeUrl(url))
    .filter(Boolean)
  return `<form class="admin-drawer-form" id="admin-product-form">
    <input type="hidden" name="id" value="${isDuplicate ? '' : escapeHtml(p.id || '')}">

    <div class="admin-form-section">
      <div class="admin-form-section-title">CORE DETAILS</div>
      <label>PRODUCT NAME *<input name="name" required maxlength="140" value="${escapeHtml(isDuplicate ? `${p.name || ''} (Copy)` : p.name || '')}"></label>
      <div class="form-two">
        <label>CATEGORY<select name="category">${CATEGORIES.map(
          (c) =>
            `<option value="${escapeHtml(c[4])}" ${p.category === c[1] || p.category === c[4] ? 'selected' : ''}>${escapeHtml(c[1])}</option>`,
        ).join('')}</select></label>
        <label>CONDITION<input name="condition" maxlength="40" value="${escapeHtml(p.condition || 'Labs')}"></label>
      </div>
      <div class="form-two">
        <label>PRICE (€) *<input name="price" type="number" min="0" step="0.01" required value="${escapeHtml(p.price ?? '')}"></label>
        <label>STOCK QTY<input name="stock" type="number" min="0" value="${escapeHtml(p.stock ?? 1)}"></label>
      </div>
      <div class="form-two">
        <label>MANUFACTURER<input name="manufacturer" maxlength="80" placeholder="e.g. BMW Original" value="${escapeHtml(p.manufacturer || '')}"></label>
        <label>BADGE TAG (optional)<input name="tag" maxlength="40" placeholder="Defaults to condition" value="${escapeHtml(p.tag || '')}"></label>
      </div>
    </div>

    <div class="admin-form-section">
      <div class="admin-form-section-title">VEHICLE FITMENT &amp; CODES</div>
      <div class="form-two">
        <label>BRAND<input name="brand" maxlength="60" placeholder="e.g. BMW" value="${escapeHtml(p.brand || '')}"></label>
        <label>MODEL<input name="model" maxlength="80" placeholder="e.g. 5. sērija F10" value="${escapeHtml(p.model || '')}"></label>
      </div>
      <div class="form-two">
        <label>OEM NUMBER<input name="oem" maxlength="60" value="${escapeHtml(p.oem || '')}"></label>
        <label>PART CODE (SKU)<input name="code" maxlength="60" value="${escapeHtml(isDuplicate ? '' : p.code || '')}"></label>
      </div>
      <div class="form-two">
        <label>YEAR RANGE<input name="production_year" maxlength="30" placeholder="e.g. 2010–2017" value="${escapeHtml(p.production_year || '')}"></label>
        <label>ENGINE<input name="engine" maxlength="60" placeholder="e.g. 530d 3.0 D" value="${escapeHtml(p.engine || '')}"></label>
      </div>
    </div>

    <div class="admin-form-section">
      <div class="admin-form-section-title">WAREHOUSE &amp; SPECS</div>
      <div class="form-two">
        <label>SHELF LOCATION<input name="location" maxlength="80" placeholder="e.g. Plaukts B3 / 2. rinda" value="${escapeHtml(p.location || '')}"></label>
        <label>WARRANTY<input name="warranty" maxlength="40" placeholder="e.g. 3 months" value="${escapeHtml(p.warranty || '')}"></label>
      </div>
      <div class="form-two">
        <label>WEIGHT<input name="weight" maxlength="40" placeholder="e.g. 4.2 kg" value="${escapeHtml(p.weight || '')}"></label>
        <label>DIMENSIONS<input name="dimensions" maxlength="60" placeholder="e.g. 78 × 32 × 28 cm" value="${escapeHtml(p.dimensions || '')}"></label>
      </div>
    </div>

    <div class="admin-form-section">
      <div class="admin-form-section-title">PHOTOS &amp; DESCRIPTION</div>
      ${
        initialImages.length
          ? `<label>CURRENT PHOTOS<div class="admin-listing-images" id="admin-product-image-tiles">${initialImages
              .map(
                (url) => `<div class="editable-image-tile" data-product-img-url="${escapeHtml(url)}">
                  <img src="${escapeHtml(url)}" alt="">
                  <button class="editable-image-remove" type="button" data-remove-product-img="${escapeHtml(url)}" aria-label="Remove photo">×</button>
                </div>`,
              )
              .join('')}</div></label>`
          : ''
      }
      <label>UPLOAD PHOTOS (max 10 files, up to 5 MB each)<input name="image_files" type="file" accept="image/*" multiple></label>
      <label>IMAGE URLS (one per line, optional)<textarea name="images" id="admin-product-images-textarea" rows="3">${escapeHtml(initialImages.join('\n'))}</textarea></label>
      <label>DESCRIPTION<textarea name="description" rows="4" maxlength="2000">${escapeHtml(p.description || '')}</textarea></label>
    </div>

    <p class="form-message" id="admin-product-form-message"></p>
    <div class="admin-drawer-footer">
      <button class="button button-accent" type="submit">${product && !isDuplicate ? 'SAVE CHANGES ↗' : 'CREATE PRODUCT ↗'}</button>
      <button class="admin-ghost-btn" type="button" id="admin-product-cancel">Cancel</button>
    </div>
  </form>`
}

function openProductDrawer(existingProduct, { isDuplicate = false } = {}) {
  const title = isDuplicate ? 'Duplicate product' : existingProduct ? 'Edit product' : 'New catalog product'
  const subtitle = isDuplicate
    ? 'COPY INVENTORY ITEM'
    : existingProduct
      ? existingProduct.code || existingProduct.id
      : 'CATALOG INVENTORY'
  openAdminDrawer(title, subtitle, adminProductFormMarkup(existingProduct, { isDuplicate }))
  const body = document.querySelector('#admin-drawer-body')
  if (!body) return

  document.querySelector('#admin-product-cancel')?.addEventListener('click', closeAdminDrawer)
  body.querySelectorAll('[data-remove-product-img]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const targetUrl = btn.dataset.removeProductImg
      const textarea = document.querySelector('#admin-product-images-textarea')
      if (textarea) {
        textarea.value = textarea.value
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && line !== targetUrl)
          .join('\n')
      }
      btn.closest('.editable-image-tile')?.remove()
    }),
  )

  const form = document.querySelector('#admin-product-form')
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    await withSubmitLock(form, async () => {
      const message = document.querySelector('#admin-product-form-message')
      const data = new FormData(form)
      const id = data.get('id') || `${slugify(data.get('name'))}-${Math.random().toString(36).slice(2, 7)}`
      const urlImages = String(data.get('images') || '')
        .split('\n')
        .map((line) => safeUrl(line.trim()))
        .filter(Boolean)
      const { valid: files, error: fileError } = validateImageFiles(data.getAll('image_files'), {
        existingCount: urlImages.length,
      })
      if (fileError) {
        message.textContent = fileError
        return
      }
      const uploadedUrls = []
      if (files.length) {
        message.textContent = `Uploading ${files.length} ${files.length === 1 ? 'photo' : 'photos'}...`
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index]
          const safeName = sanitizeUploadFilename(file.name, index)
          const path = `${id}/${safeName}`
          const upload = await supabase.storage.from('product-images').upload(path, file)
          if (upload.error) {
            message.textContent = `Photo upload failed: ${upload.error.message}`
            return
          }
          const publicUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
          if (publicUrl) uploadedUrls.push(publicUrl)
        }
      }
      const images = [...urlImages, ...uploadedUrls]
      const condition = String(data.get('condition') || '').trim()
      const customTag = String(data.get('tag') || '').trim()
      const row = {
        id,
        name: data.get('name'),
        category: data.get('category'),
        condition,
        price: Number(data.get('price')),
        stock: Math.max(0, Number(data.get('stock')) || 0),
        brand: data.get('brand'),
        model: data.get('model'),
        oem: data.get('oem'),
        code: data.get('code'),
        manufacturer: data.get('manufacturer'),
        production_year: data.get('production_year'),
        engine: data.get('engine'),
        weight: data.get('weight'),
        dimensions: data.get('dimensions'),
        warranty: data.get('warranty'),
        location: data.get('location'),
        image: images[0] || '',
        images,
        description: data.get('description'),
        type: 'Lietota detaļa',
        tag: customTag || condition,
      }
      const { error } = await supabase.from('products').upsert(row)
      if (error) {
        message.textContent = error.message
        return
      }
      await loadProducts()
      closeAdminDrawer()
      showToast(existingProduct && !isDuplicate ? `Updated "${row.name}"` : `Added "${row.name}"`)
      renderAdminTab(activeTab === 'dashboard' ? 'dashboard' : 'products')
    })
  })
}

async function updateProductStock(productId, nextStock) {
  const safeStock = Math.max(0, Number(nextStock) || 0)
  const { error } = await supabase.from('products').update({ stock: safeStock }).eq('id', productId)
  if (error) {
    showToast(`Stock update failed: ${error.message}`, { isWarning: true })
    return false
  }
  await loadProducts()
  showToast(`Stock updated to ${safeStock} pcs`)
  return true
}

function exportProductsCsv(products) {
  const headers = ['id', 'name', 'brand', 'model', 'category', 'oem', 'code', 'condition', 'price', 'stock', 'location']
  const esc = (val) => `"${String(val ?? '').replaceAll('"', '""')}"`
  const csv = [
    headers.join(','),
    ...products.map((p) => headers.map((h) => esc(p[h])).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trackapart-catalog-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  showToast(`Exported ${products.length} products to CSV`)
}

function updateSidebarBadges({ productsCount, activeListingsCount, pendingOrdersCount, reportCount }) {
  const prodBadge = document.querySelector('#products-badge')
  if (prodBadge) prodBadge.textContent = String(productsCount || 0)
  const listBadge = document.querySelector('#pending-badge')
  if (listBadge) listBadge.textContent = String(activeListingsCount || 0)
  const ordBadge = document.querySelector('#orders-badge')
  if (ordBadge) {
    ordBadge.textContent = String(pendingOrdersCount || 0)
    ordBadge.hidden = !pendingOrdersCount
  }
  const repBadge = document.querySelector('#reports-badge')
  if (repBadge) {
    repBadge.textContent = String(reportCount || 0)
    repBadge.hidden = !reportCount
  }
}

async function renderAdminTab(tab) {
  const content = document.querySelector('#admin-content')
  if (!content) return
  const products = getProducts()
  const roleLabel = ROLE_LABELS[currentAdminProfile?.role] || currentAdminProfile?.role || 'Staff'

  const [{ count: activeListingsCount }, { count: pendingOrdersCount }, { count: reportCount }] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }),
  ])
  updateSidebarBadges({
    productsCount: products.length,
    activeListingsCount,
    pendingOrdersCount,
    reportCount,
  })

  if (tab === 'dashboard') {
    const totalUnits = products.reduce((sum, p) => sum + Math.max(0, Number(p.stock || 0)), 0)
    const lowStockItems = products.filter((p) => Number(p.stock || 0) <= LOW_STOCK_THRESHOLD)
    const [{ data: recentOrders }, { data: recentListings }] = await Promise.all([
      supabase
        .from('orders')
        .select('id, buyer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('listings')
        .select('id, title, brand, model, price, status, created_at')
        .neq('status', 'removed')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">OVERVIEW</span><h2>Operations dashboard</h2></div>
      </div>

      <div class="admin-kpi-grid">
        <button class="admin-kpi-card" type="button" data-jump-tab="products">
          <span>Catalog products</span>
          <strong>${products.length}</strong>
          <small>${totalUnits} total units in stock</small>
        </button>
        <button class="admin-kpi-card${lowStockItems.length ? ' is-alert' : ''}" type="button" data-jump-low-stock="1">
          <span>Low / out of stock</span>
          <strong class="${lowStockItems.length ? 'warning' : ''}">${lowStockItems.length}</strong>
          <small>${lowStockItems.length ? '≤ 2 pcs remaining' : 'All stock levels healthy'}</small>
        </button>
        <button class="admin-kpi-card${pendingOrdersCount ? ' is-alert' : ''}" type="button" data-jump-pending-orders="1">
          <span>Pending orders</span>
          <strong class="${pendingOrdersCount ? 'warning' : ''}">${pendingOrdersCount || 0}</strong>
          <small>${pendingOrdersCount ? 'Needs buyer follow-up' : 'All orders handled'}</small>
        </button>
        <button class="admin-kpi-card" type="button" data-jump-tab="listings">
          <span>Active listings</span>
          <strong>${activeListingsCount || 0}</strong>
          <small>Community marketplace</small>
        </button>
        <button class="admin-kpi-card${reportCount ? ' is-alert' : ''}" type="button" data-jump-tab="reports">
          <span>Open reports</span>
          <strong class="${reportCount ? 'warning' : ''}">${reportCount || 0}</strong>
          <small>${reportCount ? 'Review flagged items' : 'Queue is clear'}</small>
        </button>
      </div>

      <div class="admin-dash-split">
        <div class="admin-card">
          <div class="admin-card-head">
            <div><span class="admin-overline">STOCK WATCH</span><h3>Low &amp; out-of-stock parts</h3></div>
            <button class="admin-link-btn" type="button" data-jump-tab="products">All products ↗</button>
          </div>
          ${
            lowStockItems.length
              ? `<div class="admin-compact-list">${lowStockItems
                  .slice(0, 6)
                  .map(
                    (p) => `<div class="admin-compact-row">
                      <div>
                        <strong>${escapeHtml(p.name)}</strong>
                        <small>${escapeHtml(p.location || p.category || '-')} · ${formatPrice(p.price)}</small>
                      </div>
                      <div class="stock-stepper">
                        <button type="button" class="stepper-btn" data-dash-stock-id="${escapeHtml(p.id)}" data-delta="-1" aria-label="Decrease stock">−</button>
                        <span class="stepper-val${Number(p.stock) === 0 ? ' is-zero' : ''}">${Number(p.stock || 0)}</span>
                        <button type="button" class="stepper-btn" data-dash-stock-id="${escapeHtml(p.id)}" data-delta="1" aria-label="Increase stock">+</button>
                      </div>
                    </div>`,
                  )
                  .join('')}</div>`
              : '<p class="admin-empty-state">All catalog parts have more than 2 units in stock.</p>'
          }
        </div>

        <div class="admin-card">
          <div class="admin-card-head">
            <div><span class="admin-overline">RECENT ACTIVITY</span><h3>${recentOrders?.length ? 'Latest orders' : 'Latest community listings'}</h3></div>
            <button class="admin-link-btn" type="button" data-jump-tab="${recentOrders?.length ? 'orders' : 'listings'}">View all ↗</button>
          </div>
          ${
            recentOrders?.length
              ? `<div class="admin-compact-list">${recentOrders
                  .map(
                    (o) => `<div class="admin-compact-row">
                      <div>
                        <strong>#${escapeHtml(o.id)} · ${escapeHtml(o.buyer_name)}</strong>
                        <small>${new Date(o.created_at).toLocaleDateString('lv-LV')}</small>
                      </div>
                      <div class="admin-compact-right">
                        <b>${formatPrice(o.total)}</b>
                        <span class="status-pill status-${escapeHtml(o.status)}">${escapeHtml(o.status)}</span>
                      </div>
                    </div>`,
                  )
                  .join('')}</div>`
              : recentListings?.length
                ? `<div class="admin-compact-list">${recentListings
                    .map(
                      (l) => `<div class="admin-compact-row is-clickable" data-dash-listing="${escapeHtml(l.id)}">
                        <div>
                          <strong>${escapeHtml(l.title)}</strong>
                          <small>${escapeHtml(l.brand || '-')} ${escapeHtml(l.model || '')} · ${new Date(l.created_at).toLocaleDateString('lv-LV')}</small>
                        </div>
                        <div class="admin-compact-right">
                          <b>${formatPrice(l.price)}</b>
                          <span class="status-pill status-${escapeHtml(l.status)}">${escapeHtml(l.status)}</span>
                        </div>
                      </div>`,
                    )
                    .join('')}</div>`
                : '<p class="admin-empty-state">No orders or community listings yet.</p>'
          }
        </div>
      </div>`

    content.querySelectorAll('[data-jump-tab]').forEach((btn) =>
      btn.addEventListener('click', () => switchAdminTab(btn.dataset.jumpTab)),
    )
    content.querySelector('[data-jump-low-stock]')?.addEventListener('click', () => {
      tabState.productStock = 'low'
      switchAdminTab('products')
    })
    content.querySelector('[data-jump-pending-orders]')?.addEventListener('click', () => {
      tabState.orderStatus = 'pending'
      switchAdminTab('orders')
    })
    content.querySelectorAll('[data-dash-listing]').forEach((row) =>
      row.addEventListener('click', () => showListingDetail(row.dataset.dashListing)),
    )
    content.querySelectorAll('[data-dash-stock-id]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const prod = getProducts().find((p) => p.id === btn.dataset.dashStockId)
        if (!prod) return
        const next = Math.max(0, Number(prod.stock || 0) + Number(btn.dataset.delta))
        if (await updateProductStock(prod.id, next)) renderAdminTab('dashboard')
      }),
    )
    return
  }

  if (tab === 'products') {
    const lowCount = products.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= LOW_STOCK_THRESHOLD).length
    const outCount = products.filter((p) => Number(p.stock || 0) <= 0).length

    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">INVENTORY</span><h2>Products</h2></div>
        <span class="admin-count" id="admin-products-count"></span>
      </div>

      <div class="admin-toolbar">
        <input class="admin-search" id="admin-product-search" placeholder="Search name, OEM, SKU, brand, shelf..." value="${escapeHtml(tabState.productQuery)}">
        <select class="admin-select" id="admin-product-cat" aria-label="Filter by category">
          <option value="">All categories</option>
          ${CATEGORIES.map(
            (c) => `<option value="${escapeHtml(c[4])}" ${tabState.productCategory === c[4] ? 'selected' : ''}>${escapeHtml(c[1])}</option>`,
          ).join('')}
        </select>
        <select class="admin-select" id="admin-product-sort" aria-label="Sort products">
          <option value="newest" ${tabState.productSort === 'newest' ? 'selected' : ''}>Newest first</option>
          <option value="price-asc" ${tabState.productSort === 'price-asc' ? 'selected' : ''}>Price: low → high</option>
          <option value="price-desc" ${tabState.productSort === 'price-desc' ? 'selected' : ''}>Price: high → low</option>
          <option value="stock-asc" ${tabState.productSort === 'stock-asc' ? 'selected' : ''}>Stock: low → high</option>
        </select>
      </div>

      <div class="admin-filter-pills" id="admin-product-pills">
        <button type="button" class="admin-pill${tabState.productStock === 'all' ? ' active' : ''}" data-stock-filter="all">All (${products.length})</button>
        <button type="button" class="admin-pill${tabState.productStock === 'in' ? ' active' : ''}" data-stock-filter="in">In stock (${products.length - outCount})</button>
        <button type="button" class="admin-pill${tabState.productStock === 'low' ? ' active' : ''}" data-stock-filter="low">Low stock (${lowCount})</button>
        <button type="button" class="admin-pill${tabState.productStock === 'out' ? ' active' : ''}" data-stock-filter="out">Out of stock (${outCount})</button>
      </div>

      <div class="admin-table admin-products-table" id="admin-products-table"></div>`

    const paintProducts = () => {
      const currentProducts = getProducts()
      const filtered = currentProducts
        .filter((p) => {
          const q = tabState.productQuery.trim().toLowerCase()
          if (q) {
            const hay = [p.name, p.oem, p.code, p.brand, p.model, p.location, p.category]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            if (!hay.includes(q)) return false
          }
          if (tabState.productCategory && p.category !== tabState.productCategory) return false
          const qty = Number(p.stock || 0)
          if (tabState.productStock === 'in' && qty <= 0) return false
          if (tabState.productStock === 'low' && (qty <= 0 || qty > LOW_STOCK_THRESHOLD)) return false
          if (tabState.productStock === 'out' && qty > 0) return false
          return true
        })
        .sort((a, b) => {
          if (tabState.productSort === 'price-asc') return Number(a.price) - Number(b.price)
          if (tabState.productSort === 'price-desc') return Number(b.price) - Number(a.price)
          if (tabState.productSort === 'stock-asc') return Number(a.stock || 0) - Number(b.stock || 0)
          return 0
        })

      const countEl = document.querySelector('#admin-products-count')
      if (countEl) countEl.textContent = `Showing ${filtered.length} of ${currentProducts.length}`
      const tableEl = document.querySelector('#admin-products-table')
      if (!tableEl) return
      tableEl.innerHTML = `<div class="admin-table-head"><span>Product</span><span>Shelf &amp; Category</span><span>Stock</span><span>Price</span><span>Actions</span></div>
        ${
          filtered.length
            ? filtered
                .map((product) => {
                  const thumb = safeUrl(product.image || product.images?.[0])
                  const qty = Number(product.stock || 0)
                  return `<div class="admin-table-row">
                    <div class="admin-product-cell">
                      <span class="admin-thumb">${thumb ? `<img src="${escapeHtml(thumb)}" alt="" loading="lazy">` : ''}</span>
                      <div>
                        <strong>${escapeHtml(product.name)}</strong>
                        <small>${escapeHtml([product.brand, product.model, product.oem ? `OEM ${product.oem}` : ''].filter(Boolean).join(' · '))}</small>
                      </div>
                    </div>
                    <div class="admin-meta-cell">
                      <span>${escapeHtml(product.category || '-')}</span>
                      <small>${escapeHtml(product.location || 'No shelf assigned')}</small>
                    </div>
                    <div class="stock-stepper">
                      <button type="button" class="stepper-btn" data-step-id="${escapeHtml(product.id)}" data-delta="-1" aria-label="Decrease stock">−</button>
                      <input type="number" min="0" value="${qty}" data-stock-id="${escapeHtml(product.id)}" aria-label="Stock for ${escapeHtml(product.name)}" class="stepper-input${qty === 0 ? ' is-zero' : qty <= LOW_STOCK_THRESHOLD ? ' is-low' : ''}">
                      <button type="button" class="stepper-btn" data-step-id="${escapeHtml(product.id)}" data-delta="1" aria-label="Increase stock">+</button>
                    </div>
                    <b>${formatPrice(product.price)}</b>
                    <span class="row-actions">
                      <a class="row-action" href="#product-${escapeHtml(product.id)}" title="Open on storefront">↗</a>
                      <button class="row-action" type="button" data-edit-id="${escapeHtml(product.id)}">Edit</button>
                      <button class="row-action" type="button" data-dup-id="${escapeHtml(product.id)}" title="Duplicate product">Copy</button>
                      <button class="row-action is-danger" type="button" data-delete-id="${escapeHtml(product.id)}">Delete</button>
                    </span>
                  </div>`
                })
                .join('')
            : '<p class="admin-empty-state">No products match the current filters.</p>'
        }`

      tableEl.querySelectorAll('[data-edit-id]').forEach((button) =>
        button.addEventListener('click', () =>
          openProductDrawer(currentProducts.find((p) => p.id === button.dataset.editId)),
        ),
      )
      tableEl.querySelectorAll('[data-dup-id]').forEach((button) =>
        button.addEventListener('click', () =>
          openProductDrawer(currentProducts.find((p) => p.id === button.dataset.dupId), { isDuplicate: true }),
        ),
      )
      tableEl.querySelectorAll('[data-delete-id]').forEach((button) =>
        button.addEventListener('click', async () => {
          const prod = currentProducts.find((p) => p.id === button.dataset.deleteId)
          if (!window.confirm(`Delete "${prod?.name || 'this product'}"?`)) return
          const { error } = await supabase.from('products').delete().eq('id', button.dataset.deleteId)
          if (error) {
            showToast(error.message, { isWarning: true })
            return
          }
          await loadProducts()
          showToast('Product deleted')
          renderAdminTab('products')
        }),
      )
      tableEl.querySelectorAll('[data-step-id]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          const prod = getProducts().find((p) => p.id === btn.dataset.stepId)
          if (!prod) return
          const next = Math.max(0, Number(prod.stock || 0) + Number(btn.dataset.delta))
          if (await updateProductStock(prod.id, next)) renderAdminTab('products')
        }),
      )
      tableEl.querySelectorAll('[data-stock-id]').forEach((input) =>
        input.addEventListener('change', async () => {
          if (await updateProductStock(input.dataset.stockId, input.value)) renderAdminTab('products')
        }),
      )
    }

    document.querySelector('#admin-product-search')?.addEventListener('input', (event) => {
      tabState.productQuery = event.target.value
      paintProducts()
    })
    document.querySelector('#admin-product-cat')?.addEventListener('change', (e) => {
      tabState.productCategory = e.target.value
      paintProducts()
    })
    document.querySelector('#admin-product-sort')?.addEventListener('change', (e) => {
      tabState.productSort = e.target.value
      paintProducts()
    })
    content.querySelectorAll('[data-stock-filter]').forEach((btn) =>
      btn.addEventListener('click', () => {
        tabState.productStock = btn.dataset.stockFilter
        content.querySelectorAll('[data-stock-filter]').forEach((p) =>
          p.classList.toggle('active', p.dataset.stockFilter === tabState.productStock),
        )
        paintProducts()
      }),
    )
    enhanceSelects(content)
    paintProducts()
    return
  }

  if (tab === 'orders') {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, buyer_name, buyer_email, buyer_phone, buyer_address, notes, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    const itemsByOrder = {}
    if (orders?.length) {
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity')
        .in(
          'order_id',
          orders.map((o) => o.id),
        )
      items?.forEach((item) => {
        const label = item.quantity > 1 ? `${item.product_name} ×${item.quantity}` : item.product_name
        ;(itemsByOrder[item.order_id] ??= []).push(label)
      })
    }

    const allOrders = orders || []
    const today = new Date().toDateString()
    const todayOrders = allOrders.filter((o) => new Date(o.created_at).toDateString() === today)
    const revenueToday = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0)
    const activeOrders = allOrders.filter((o) => o.status !== 'cancelled')
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const avgOrderValue = activeOrders.length ? totalRevenue / activeOrders.length : 0

    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">FULFILLMENT</span><h2>Orders</h2></div>
        <span class="admin-count" id="admin-orders-count"></span>
      </div>

      <div class="admin-metrics">
        <div><span>Orders today</span><strong>${todayOrders.length}</strong></div>
        <div><span>Pending action</span><strong class="${allOrders.filter((o) => o.status === 'pending').length ? 'warning' : ''}">${allOrders.filter((o) => o.status === 'pending').length}</strong></div>
        <div><span>Revenue today</span><strong>${revenueToday.toFixed(0)} €</strong></div>
        <div><span>Total revenue</span><strong>${totalRevenue.toFixed(0)} €</strong></div>
        <div><span>Avg. order</span><strong>${avgOrderValue.toFixed(0)} €</strong></div>
      </div>

      <div class="admin-toolbar">
        <input class="admin-search" id="admin-order-search" placeholder="Search order #, buyer name, email, phone, address, or part..." value="${escapeHtml(tabState.orderQuery)}">
      </div>

      <div class="admin-filter-pills">
        <button type="button" class="admin-pill${tabState.orderStatus === 'all' ? ' active' : ''}" data-order-filter="all">All (${allOrders.length})</button>
        ${ORDER_STATUSES.map((st) => {
          const cnt = allOrders.filter((o) => o.status === st).length
          return `<button type="button" class="admin-pill${tabState.orderStatus === st ? ' active' : ''}" data-order-filter="${st}">${st[0].toUpperCase() + st.slice(1)} (${cnt})</button>`
        }).join('')}
      </div>

      <div class="admin-table cols-5" id="admin-orders-table"></div>`

    const paintOrders = () => {
      const filteredOrders = allOrders.filter((o) => {
        if (tabState.orderStatus !== 'all' && o.status !== tabState.orderStatus) return false
        const q = tabState.orderQuery.trim().toLowerCase()
        if (!q) return true
        const hay = [
          `#${o.id}`,
          o.buyer_name,
          o.buyer_email,
          o.buyer_phone,
          o.buyer_address,
          o.notes,
          ...(itemsByOrder[o.id] || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      const countEl = document.querySelector('#admin-orders-count')
      if (countEl) countEl.textContent = `${filteredOrders.length} shown`
      const tableEl = document.querySelector('#admin-orders-table')
      if (!tableEl) return
      tableEl.innerHTML = filteredOrders.length
        ? `<div class="admin-table-head"><span>Order</span><span>Items</span><span>Buyer &amp; shipping</span><span>Total</span><span>Status</span></div>
          ${filteredOrders
            .map(
              (order) => `<div class="admin-table-row admin-order-row">
                <div>
                  <code>#${escapeHtml(order.id)}</code>
                  <small class="admin-row-sub">${new Date(order.created_at).toLocaleString('lv-LV')}</small>
                </div>
                <span>${escapeHtml((itemsByOrder[order.id] || []).join(', ') || '-')}</span>
                <div class="order-buyer-cell">
                  <strong>${escapeHtml(order.buyer_name)}</strong>
                  ${order.buyer_email ? `<a href="mailto:${escapeHtml(order.buyer_email)}">${escapeHtml(order.buyer_email)}</a>` : ''}
                  ${order.buyer_phone ? `<span>${escapeHtml(order.buyer_phone)}</span>` : ''}
                  ${order.buyer_address ? `<span>${escapeHtml(order.buyer_address)}</span>` : ''}
                  ${order.notes ? `<em>Note: ${escapeHtml(order.notes)}</em>` : ''}
                  <button class="row-action admin-copy-btn" type="button" data-copy-order="${escapeHtml(order.id)}">Copy shipping</button>
                </div>
                <b>${formatPrice(order.total)}</b>
                <select class="admin-select status-${escapeHtml(order.status)}" data-order-status="${escapeHtml(order.id)}" aria-label="Order #${escapeHtml(order.id)} status">
                  ${ORDER_STATUSES.map((status) => `<option ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}
                </select>
              </div>`,
            )
            .join('')}`
        : '<p class="admin-empty-state">No orders match this view. Customer cart requests will appear here so you can arrange payment and shipping.</p>'

      tableEl.querySelectorAll('[data-copy-order]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          const order = allOrders.find((o) => String(o.id) === btn.dataset.copyOrder)
          if (!order) return
          const text = [
            `Order #${order.id}`,
            `Buyer: ${order.buyer_name}`,
            order.buyer_phone ? `Phone: ${order.buyer_phone}` : '',
            order.buyer_email ? `Email: ${order.buyer_email}` : '',
            order.buyer_address ? `Address: ${order.buyer_address}` : '',
            `Items: ${(itemsByOrder[order.id] || []).join(', ') || '-'}`,
            `Total: ${formatPrice(order.total)}`,
          ]
            .filter(Boolean)
            .join('\n')
          try {
            await navigator.clipboard.writeText(text)
            showToast(`Copied shipping details for Order #${order.id}`)
          } catch {
            showToast('Could not copy to clipboard', { isWarning: true })
          }
        }),
      )
      tableEl.querySelectorAll('[data-order-status]').forEach((select) => {
        select.dataset.prevStatus = select.value
        select.addEventListener('change', async () => {
          const nextStatus = select.value
          const { error } = await supabase
            .from('orders')
            .update({ status: nextStatus })
            .eq('id', select.dataset.orderStatus)
          if (error) {
            select.value = select.dataset.prevStatus
            syncSelect(select)
            showToast(error.message, { isWarning: true })
            return
          }
          showToast(`Order #${select.dataset.orderStatus} → ${nextStatus}`)
          renderAdminTab('orders')
        })
      })
      enhanceSelects(tableEl)
    }

    document.querySelector('#admin-order-search')?.addEventListener('input', (e) => {
      tabState.orderQuery = e.target.value
      paintOrders()
    })
    content.querySelectorAll('[data-order-filter]').forEach((btn) =>
      btn.addEventListener('click', () => {
        tabState.orderStatus = btn.dataset.orderFilter
        content.querySelectorAll('[data-order-filter]').forEach((p) =>
          p.classList.toggle('active', p.dataset.orderFilter === tabState.orderStatus),
        )
        paintOrders()
      }),
    )
    paintOrders()
    return
  }

  if (tab === 'listings') {
    const { data: rows } = await supabase
      .from('listings')
      .select('id, title, brand, model, price, location, status, oem_number, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    const allRows = rows || []
    const ids = allRows.map((r) => r.id)
    const thumbs = {}
    if (ids.length) {
      const { data: imgs } = await supabase
        .from('listing_images')
        .select('listing_id, storage_path')
        .in('listing_id', ids)
        .order('sort_order')
      ;(imgs || []).forEach((img) => {
        const p = String(img.storage_path || '').trim()
        if (p && !thumbs[img.listing_id]) {
          thumbs[img.listing_id] = safeUrl(supabase.storage.from('listing-images').getPublicUrl(p).data.publicUrl)
        }
      })
    }

    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">COMMUNITY</span><h2>Community listings</h2></div>
        <span class="admin-count" id="admin-listings-count"></span>
      </div>
      <p class="admin-note">New listings publish automatically. Click any row to inspect photos and seller details, or restore removed listings.</p>

      <div class="admin-toolbar">
        <input class="admin-search" id="admin-listing-search" placeholder="Search title, brand, model, OEM, or city..." value="${escapeHtml(tabState.listingQuery)}">
      </div>

      <div class="admin-filter-pills">
        ${LISTING_FILTERS.map((st) => {
          const cnt = st === 'all' ? allRows.length : allRows.filter((r) => r.status === st).length
          return `<button type="button" class="admin-pill${tabState.listingStatus === st ? ' active' : ''}" data-listing-filter="${st}">${st[0].toUpperCase() + st.slice(1)} (${cnt})</button>`
        }).join('')}
      </div>

      <div class="moderation-list" id="admin-listings-list"></div>`

    const paintListings = () => {
      const filtered = allRows.filter((row) => {
        if (tabState.listingStatus !== 'all' && row.status !== tabState.listingStatus) return false
        const q = tabState.listingQuery.trim().toLowerCase()
        if (!q) return true
        const hay = [row.title, row.brand, row.model, row.location, row.oem_number]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      const countEl = document.querySelector('#admin-listings-count')
      if (countEl) countEl.textContent = `${filtered.length} shown`
      const listEl = document.querySelector('#admin-listings-list')
      if (!listEl) return
      listEl.innerHTML = filtered.length
        ? filtered
            .map(
              (row) => `<div class="moderation-row" data-view-id="${escapeHtml(row.id)}">
                <div class="moderation-row-main">
                  <span class="admin-thumb">${thumbs[row.id] ? `<img src="${escapeHtml(thumbs[row.id])}" alt="" loading="lazy">` : ''}</span>
                  <div>
                    <strong>${escapeHtml(row.title)}</strong>
                    <small>${escapeHtml(row.brand || '-')} ${escapeHtml(row.model || '')} · ${escapeHtml(row.location || '-')} · ${formatPrice(row.price)} · <span class="status-pill status-${escapeHtml(row.status)}">${escapeHtml(row.status)}</span></small>
                  </div>
                </div>
                <div class="row-actions">
                  ${row.status === 'active' ? `<a class="row-action" href="#listing-${escapeHtml(row.id)}" title="Open on storefront">↗</a>` : ''}
                  ${row.status === 'pending' ? `<button class="approve-button" type="button" data-listing-action="active" data-listing-id="${escapeHtml(row.id)}">Approve</button>` : ''}
                  ${row.status === 'removed' ? `<button class="approve-button" type="button" data-listing-action="active" data-listing-id="${escapeHtml(row.id)}">Restore</button>` : `<button class="reject-button" type="button" data-listing-action="removed" data-listing-id="${escapeHtml(row.id)}">Remove</button>`}
                </div>
              </div>`,
            )
            .join('')
        : '<p class="admin-empty-state">No listings in this status.</p>'

      listEl.querySelectorAll('[data-view-id]').forEach((row) =>
        row.addEventListener('click', (event) => {
          if (event.target.closest('button, a')) return
          showListingDetail(row.dataset.viewId)
        }),
      )
      bindListingActionButtons(listEl)
    }

    document.querySelector('#admin-listing-search')?.addEventListener('input', (e) => {
      tabState.listingQuery = e.target.value
      paintListings()
    })
    content.querySelectorAll('[data-listing-filter]').forEach((btn) =>
      btn.addEventListener('click', () => {
        tabState.listingStatus = btn.dataset.listingFilter
        content.querySelectorAll('[data-listing-filter]').forEach((p) =>
          p.classList.toggle('active', p.dataset.listingFilter === tabState.listingStatus),
        )
        paintListings()
      }),
    )
    paintListings()
    return
  }

  if (tab === 'reports') {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, listing_id, reporter_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    const listingIds = [...new Set((reports || []).map((r) => r.listing_id).filter(Boolean))]
    const reporterIds = [...new Set((reports || []).map((r) => r.reporter_id).filter(Boolean))]
    const [{ data: reportedListings }, { data: reporters }] = await Promise.all([
      listingIds.length
        ? supabase.from('listings').select('id, title, status').in('id', listingIds)
        : Promise.resolve({ data: [] }),
      reporterIds.length
        ? supabase.from('profiles').select('id, display_name, username').in('id', reporterIds)
        : Promise.resolve({ data: [] }),
    ])
    const listingById = Object.fromEntries((reportedListings || []).map((l) => [l.id, l]))
    const reporterById = Object.fromEntries((reporters || []).map((p) => [p.id, p.display_name || p.username || 'User']))
    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">MODERATION</span><h2>Reports</h2></div>
        <span class="admin-count">${reports?.length || 0} open</span>
      </div>
      ${error ? `<p class="form-message">${escapeHtml(error.message)}</p>` : ''}
      <div class="moderation-list">${
        reports?.length
          ? reports
              .map((rep) => {
                const listing = listingById[rep.listing_id]
                const reporter = rep.reporter_id ? reporterById[rep.reporter_id] || 'User' : 'Deleted user'
                return `<div class="moderation-row" data-report-view-id="${escapeHtml(rep.listing_id)}">
                  <div>
                    <strong>${escapeHtml(listing?.title || `Listing #${rep.listing_id}`)} ${listing?.status ? `<span class="status-pill status-${escapeHtml(listing.status)}">${escapeHtml(listing.status)}</span>` : ''}</strong>
                    <div class="report-reason-box">${escapeHtml(rep.reason)}</div>
                    <small>Reported by ${escapeHtml(reporter)} · ${new Date(rep.created_at).toLocaleString('lv-LV')}</small>
                  </div>
                  <div class="row-actions">
                    ${listing && listing.status !== 'removed' ? `<button class="reject-button" type="button" data-report-remove-listing="${escapeHtml(rep.listing_id)}" data-report-id="${escapeHtml(rep.id)}">Remove listing</button>` : ''}
                    <button class="row-action" type="button" data-report-dismiss="${escapeHtml(rep.id)}">Dismiss</button>
                  </div>
                </div>`
              })
              .join('')
          : '<p class="admin-empty-state">No open reports. Flagged community listings will show up here for triage.</p>'
      }</div>`

    content.querySelectorAll('[data-report-view-id]').forEach((row) =>
      row.addEventListener('click', (event) => {
        if (event.target.closest('button')) return
        showListingDetail(row.dataset.reportViewId)
      }),
    )
    content.querySelectorAll('[data-report-dismiss]').forEach((button) =>
      button.addEventListener('click', async () => {
        const { error: delError } = await supabase.from('reports').delete().eq('id', button.dataset.reportDismiss)
        if (delError) {
          showToast(delError.message, { isWarning: true })
          return
        }
        showToast('Report dismissed')
        renderAdminTab('reports')
      }),
    )
    content.querySelectorAll('[data-report-remove-listing]').forEach((button) =>
      button.addEventListener('click', async () => {
        const listingId = button.dataset.reportRemoveListing
        const reportId = button.dataset.reportId
        const { error: updError } = await supabase.from('listings').update({ status: 'removed' }).eq('id', listingId)
        if (updError) {
          showToast(updError.message, { isWarning: true })
          return
        }
        await supabase.from('reports').delete().eq('id', reportId)
        notifyEmail('listing_status', { listingId, status: 'removed' })
        showToast('Listing removed & report resolved')
        renderAdminTab('reports')
      }),
    )
    return
  }

  if (tab === 'tasks') {
    const { data: staff } = await supabase
      .from('profiles')
      .select('display_name, username, role, city')
      .in('role', STAFF_ROLES)
      .order('created_at', { ascending: true })
    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">OPERATIONS</span><h2>Team</h2></div>
        <button class="admin-ghost-btn" id="admin-toggle-staff-guide" type="button">+ How to add staff</button>
      </div>
      <div class="admin-info-banner" id="admin-staff-guide" hidden>
        <strong>Adding a new staff member</strong>
        <p>1. Create or locate their user in <b>Supabase → Authentication → Users</b>.</p>
        <p>2. In <b>Table Editor → profiles</b>, set their <code>role</code> to <code>manager</code>, <code>warehouse</code>, or <code>fulfillment</code>.</p>
        <p>3. On their first sign-in to <code>#admin</code>, they will be prompted to enroll mandatory 2FA.</p>
      </div>
      <div class="admin-table">
        <div class="admin-table-head"><span>Name</span><span>Username</span><span>Role</span><span>City</span></div>
        ${
          staff?.length
            ? staff
                .map(
                  (person) => `<div class="admin-table-row">
                    <strong>${escapeHtml(person.display_name || person.username || 'Staff')}</strong>
                    <span>${escapeHtml(person.username || '-')}</span>
                    <span class="status-pill status-active">${escapeHtml(ROLE_LABELS[person.role] || person.role)}</span>
                    <span>${escapeHtml(person.city || '-')}</span>
                  </div>`,
                )
                .join('')
            : '<p class="admin-empty-state">No staff profiles found.</p>'
        }
      </div>`
    document.querySelector('#admin-toggle-staff-guide')?.addEventListener('click', () => {
      const guide = document.querySelector('#admin-staff-guide')
      if (guide) guide.hidden = !guide.hidden
    })
    return
  }

  if (tab === 'settings') {
    const adminEmail = (await supabase.auth.getUser()).data.user?.email || ''
    content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">CONFIGURATION</span><h2>Settings</h2></div></div>
      <div class="admin-dash-split">
        <div class="settings-card">
          <h3>Account &amp; Security</h3>
          <label>Admin email<input value="${escapeHtml(adminEmail)}" readonly></label>
          <label>Role<input value="${escapeHtml(roleLabel)}" readonly></label>
          <div class="admin-security-badge">✓ 2FA Active (AAL2 enforced in database)</div>
        </div>
        <div class="settings-card">
          <h3>Store &amp; Export</h3>
          <label>Low stock alert threshold<input value="${LOW_STOCK_THRESHOLD} pcs" readonly></label>
          <label>Free shipping threshold<input value="150 €" readonly></label>
          <div class="admin-settings-actions">
            <button class="admin-action" id="admin-export-csv" type="button">↓ Export catalog CSV</button>
          </div>
          <p class="admin-note">Store thresholds are currently configured in code.</p>
        </div>
      </div>`
    document.querySelector('#admin-export-csv')?.addEventListener('click', () => exportProductsCsv(getProducts()))
  }
}

function bindListingActionButtons(scope = document) {
  scope.querySelectorAll('[data-listing-action]').forEach((button) =>
    button.addEventListener('click', async () => {
      const nextStatus = button.dataset.listingAction
      const { error } = await supabase
        .from('listings')
        .update({ status: nextStatus })
        .eq('id', button.dataset.listingId)
      if (error) {
        showToast(error.message, { isWarning: true })
        return
      }
      notifyEmail('listing_status', {
        listingId: button.dataset.listingId,
        status: nextStatus,
      })
      closeAdminDrawer()
      showToast(nextStatus === 'removed' ? 'Listing removed' : 'Listing set to active')
      renderAdminTab(activeTab)
    }),
  )
}

async function showListingDetail(id) {
  openAdminDrawer('Loading listing...', 'COMMUNITY LISTING', '<p class="admin-note">Loading details...</p>')
  const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()
  if (!listing) {
    openAdminDrawer('Listing not found', 'COMMUNITY LISTING', '<p class="admin-note">This listing could not be loaded.</p>')
    return
  }
  const [{ data: profile }, { data: images }] = await Promise.all([
    supabase.from('profiles').select('display_name, phone, city, username').eq('id', listing.user_id).maybeSingle(),
    supabase.from('listing_images').select('storage_path').eq('listing_id', id).order('sort_order'),
  ])
  const imageUrls = (images || [])
    .map((image) => String(image.storage_path || '').trim())
    .filter(Boolean)
    .map((path) => safeUrl(supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl))
    .filter(Boolean)

  const html = `<div class="admin-detail-drawer">
    ${
      imageUrls.length
        ? `<div class="admin-listing-images">${imageUrls.map((url) => `<img src="${escapeHtml(url)}" alt="">`).join('')}</div>`
        : '<p class="admin-note">No photos uploaded.</p>'
    }
    <div class="detail-data">
      <span>STATUS<strong><span class="status-pill status-${escapeHtml(listing.status)}">${escapeHtml(listing.status)}</span></strong></span>
      <span>PRICE<strong>${formatPrice(listing.price)}</strong></span>
      <span>BRAND / MODEL<strong>${escapeHtml(listing.brand || '-')} ${escapeHtml(listing.model || '')}</strong></span>
      <span>YEAR / ENGINE<strong>${escapeHtml(listing.production_year || '-')} / ${escapeHtml(listing.engine || '-')}</strong></span>
      <span>OEM NUMBER<strong>${escapeHtml(listing.oem_number || '-')}</strong></span>
      <span>CATEGORY<strong>${escapeHtml(listing.category || '-')}</strong></span>
      <span>CONDITION<strong>${escapeHtml(CONDITION_NAMES[listing.condition] || listing.condition || '-')}</strong></span>
      <span>LOCATION<strong>${escapeHtml(listing.location || '-')}</strong></span>
      <span>DESCRIPTION<strong>${escapeHtml(listing.description || 'No description provided.')}</strong></span>
      <span>SELLER<strong>${escapeHtml(profile?.display_name || 'Unknown')} · ${escapeHtml(profile?.phone || 'no phone')}${profile?.city ? ' · ' + escapeHtml(profile.city) : ''}</strong></span>
      <span>SUBMITTED<strong>${new Date(listing.created_at).toLocaleString('lv-LV')}</strong></span>
    </div>
    <div class="admin-drawer-footer">
      ${listing.status === 'active' ? `<a class="admin-ghost-btn" href="#listing-${escapeHtml(listing.id)}">View on site ↗</a>` : ''}
      ${listing.status === 'pending' ? `<button class="approve-button" type="button" data-listing-action="active" data-listing-id="${escapeHtml(listing.id)}">Approve</button>` : ''}
      ${listing.status === 'removed' ? `<button class="approve-button" type="button" data-listing-action="active" data-listing-id="${escapeHtml(listing.id)}">Restore</button>` : `<button class="reject-button" type="button" data-listing-action="removed" data-listing-id="${escapeHtml(listing.id)}">Remove listing</button>`}
    </div>
  </div>`

  openAdminDrawer(listing.title, `LISTING #${listing.id}`, html)
  const drawerBody = document.querySelector('#admin-drawer-body')
  if (drawerBody) bindListingActionButtons(drawerBody)
}
