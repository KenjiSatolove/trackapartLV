import { supabase } from './lib/supabase.js'
import { CATEGORIES, CONDITION_NAMES, getProducts, loadProducts } from './data.js'
import {
  escapeHtml,
  notifyEmail,
  safeUrl,
  sanitizeUploadFilename,
  slugify,
  stockLabel,
  validateImageFiles,
  withSubmitLock,
} from './utils.js'
import { renderMfaChallenge, renderMfaEnroll } from './auth.js'

const STAFF_ROLES = ['owner', 'manager', 'warehouse', 'fulfillment']
const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  warehouse: 'Warehouse',
  fulfillment: 'Fulfillment',
}

let currentAdminProfile = null

export const adminPage = `<section class="admin-shell">
  <div class="admin-login" id="admin-login">
    <div class="admin-mark">TP / ADMIN</div>
    <div class="section-kicker">PRIVATE ACCESS</div>
    <h1>Admin<br><em>panel.</em></h1>
    <p>Sign in with a staff account to manage TrackParts.</p>
    <form class="site-form" id="admin-auth-form">
      <label>EMAIL<input name="email" type="email" required placeholder="owner@trackparts.lv"></label>
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
  loginPane.innerHTML = `<div class="admin-mark">TP / ADMIN</div>
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
  loginPane.innerHTML = `<div class="admin-mark">TP / ADMIN</div>
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
  document.querySelector('#admin-login').hidden = true
  const dashboard = document.querySelector('#admin-dashboard')
  dashboard.hidden = false
  dashboard.innerHTML = `<div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-logo">◉ <strong>Admin</strong><small>${escapeHtml(profile.username || profile.display_name || ROLE_LABELS[profile.role] || 'Staff')}</small></div>
      <button class="admin-tab active" data-tab="dashboard" type="button">▦ Dashboard</button>
      <button class="admin-tab" data-tab="products" type="button">▣ Products</button>
      <button class="admin-tab" data-tab="orders" type="button">≡ Orders</button>
      <button class="admin-tab" data-tab="listings" type="button">♧ Community listings <b id="pending-badge">0</b></button>
      <button class="admin-tab" data-tab="reports" type="button">⚑ Reports <b id="reports-badge">0</b></button>
      <button class="admin-tab" data-tab="tasks" type="button">✓ Team</button>
      <button class="admin-tab" data-tab="settings" type="button">⚙ Settings</button>
      <button class="admin-logout" id="admin-logout" type="button">Log out</button>
    </aside>
    <section class="admin-content" id="admin-content"></section>
  </div>`
  document.querySelectorAll('.admin-tab').forEach((tab) =>
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((item) => item.classList.remove('active'))
      tab.classList.add('active')
      window.scrollTo({ top: 0, behavior: 'instant' })
      renderAdminTab(tab.dataset.tab)
    }),
  )
  document.querySelector('#admin-logout').addEventListener('click', async () => {
    currentAdminProfile = null
    await supabase.auth.signOut()
    window.location.hash = 'home'
  })
  renderAdminTab('dashboard')
}

function adminProductFormMarkup(product) {
  const p = product || {}
  return `<form class="admin-product-form" id="admin-product-form">
    <h3>${product ? 'Edit product' : 'Add product'}</h3>
    <input type="hidden" name="id" value="${escapeHtml(p.id || '')}">
    <label>NAME<input name="name" required maxlength="140" value="${escapeHtml(p.name || '')}"></label>
    <div class="form-two">
      <label>CATEGORY<select name="category">${CATEGORIES.map(
        (c) =>
          `<option value="${escapeHtml(c[4])}" ${p.category === c[1] || p.category === c[4] ? 'selected' : ''}>${escapeHtml(c[1])}</option>`,
      ).join('')}</select></label>
      <label>CONDITION<input name="condition" maxlength="40" value="${escapeHtml(p.condition || 'Labs')}"></label>
    </div>
    <div class="form-two">
      <label>PRICE (€)<input name="price" type="number" min="0" step="0.01" required value="${escapeHtml(p.price ?? '')}"></label>
      <label>STOCK QTY<input name="stock" type="number" min="0" value="${escapeHtml(p.stock ?? 1)}"></label>
    </div>
    <div class="form-two">
      <label>BRAND<input name="brand" maxlength="60" value="${escapeHtml(p.brand || '')}"></label>
      <label>MODEL<input name="model" maxlength="80" value="${escapeHtml(p.model || '')}"></label>
    </div>
    <div class="form-two">
      <label>OEM NUMBER<input name="oem" maxlength="60" value="${escapeHtml(p.oem || '')}"></label>
      <label>PART CODE<input name="code" maxlength="60" value="${escapeHtml(p.code || '')}"></label>
    </div>
    <div class="form-two">
      <label>MANUFACTURER<input name="manufacturer" maxlength="80" value="${escapeHtml(p.manufacturer || '')}"></label>
      <label>BADGE TAG (optional)<input name="tag" maxlength="40" placeholder="Defaults to condition" value="${escapeHtml(p.tag || '')}"></label>
    </div>
    <div class="form-two">
      <label>YEAR RANGE<input name="production_year" maxlength="30" value="${escapeHtml(p.production_year || '')}"></label>
      <label>ENGINE<input name="engine" maxlength="60" value="${escapeHtml(p.engine || '')}"></label>
    </div>
    <div class="form-two">
      <label>WEIGHT<input name="weight" maxlength="40" placeholder="e.g. 4.2 kg" value="${escapeHtml(p.weight || '')}"></label>
      <label>DIMENSIONS<input name="dimensions" maxlength="60" placeholder="e.g. 78 × 32 × 28 cm" value="${escapeHtml(p.dimensions || '')}"></label>
    </div>
    <div class="form-two">
      <label>WARRANTY<input name="warranty" maxlength="40" placeholder="e.g. 3 months" value="${escapeHtml(p.warranty || '')}"></label>
      <label>LOCATION<input name="location" maxlength="80" value="${escapeHtml(p.location || '')}"></label>
    </div>
    ${
      (p.images?.length ? p.images : [p.image].filter(Boolean))
        .map((url) => safeUrl(url))
        .filter(Boolean).length
        ? `<label>CURRENT PHOTOS<div class="admin-listing-images" id="admin-product-image-tiles">${(
            p.images?.length ? p.images : [p.image].filter(Boolean)
          )
            .map((url) => safeUrl(url))
            .filter(Boolean)
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
    <label>IMAGE URLS (one per line, optional)<textarea name="images" id="admin-product-images-textarea" rows="3">${escapeHtml((p.images?.length ? p.images : [p.image].filter(Boolean)).join('\n'))}</textarea></label>
    <label>DESCRIPTION<textarea name="description" rows="3" maxlength="2000">${escapeHtml(p.description || '')}</textarea></label>
    <div class="form-actions">
      <button class="button button-dark" type="submit">${product ? 'Save changes' : 'Add product'}</button>
      <button class="text-button" type="button" id="admin-product-cancel">Cancel</button>
    </div>
    <p class="admin-note" id="admin-product-form-message"></p>
  </form>`
}

function bindAdminProductForm(existingProduct) {
  const holder = document.querySelector('#admin-product-form-holder')
  if (!holder) return
  holder.innerHTML = adminProductFormMarkup(existingProduct)
  document.querySelector('#admin-product-cancel').addEventListener('click', () => {
    holder.innerHTML = ''
  })
  holder.querySelectorAll('[data-remove-product-img]').forEach((btn) =>
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
  form.addEventListener('submit', async (event) => {
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
      renderAdminTab('products')
    })
  })
}

async function renderAdminTab(tab) {
  const content = document.querySelector('#admin-content')
  if (!content) return
  const products = getProducts()
  const roleLabel = ROLE_LABELS[currentAdminProfile?.role] || currentAdminProfile?.role || 'Staff'
  const [{ count: listingCount }, { count: pendingCount }, { count: reportCount }] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }).neq('status', 'removed'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }),
  ])
  const badge = document.querySelector('#pending-badge')
  if (badge) badge.textContent = listingCount || 0
  const reportsBadge = document.querySelector('#reports-badge')
  if (reportsBadge) reportsBadge.textContent = reportCount || 0

  if (tab === 'dashboard') {
    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">OVERVIEW</span><h2>Inventory overview</h2></div>
        <span class="admin-user">${escapeHtml(roleLabel)} / ${new Date().toLocaleDateString('lv-LV')}</span>
      </div>
      <div class="admin-metrics">
        <div><span>Products in stock</span><strong>${products.length}</strong></div>
        <div><span>Low stock</span><strong class="warning">${products.filter((p) => Number(p.stock) <= 2).length}</strong></div>
        <div><span>Community listings</span><strong>${listingCount || 0}</strong></div>
        <div><span>Open reports</span><strong class="warning">${reportCount || 0}</strong></div>
      </div>
      <div class="admin-table">
        <div class="admin-table-head"><span>Part</span><span>Category</span><span>Stock</span><span>Price</span></div>
        ${products
          .slice(0, 4)
          .map(
            (product) => `<div class="admin-table-row">
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.category)}</span>
              <span>${product.stock ?? 0} pcs</span>
              <b>${Number(product.price).toFixed(0)} €</b>
            </div>`,
          )
          .join('')}
      </div>`
  }

  if (tab === 'products') {
    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">INVENTORY</span><h2>Products</h2></div>
        <button class="admin-action" id="admin-add-product" type="button">+ Add product</button>
      </div>
      <input class="admin-search" id="admin-product-search" placeholder="Search by name or OEM code">
      <div id="admin-product-form-holder"></div>
      <div class="admin-table cols-5">
        <div class="admin-table-head"><span>Part</span><span>Category</span><span>Stock</span><span>Price</span><span>Actions</span></div>
        ${products
          .map(
            (product) => `<div class="admin-table-row" data-search="${escapeHtml((product.name + ' ' + (product.oem || '')).toLowerCase())}">
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.category)}</span>
              <span class="stock-edit"><input type="number" min="0" value="${escapeHtml(product.stock)}" data-stock-id="${escapeHtml(product.id)}" aria-label="Stock for ${escapeHtml(product.name)}"></span>
              <b>${Number(product.price).toFixed(0)} €</b>
              <span class="row-actions">
                <button class="row-action" type="button" data-edit-id="${escapeHtml(product.id)}">Edit</button>
                <button class="row-action" type="button" data-delete-id="${escapeHtml(product.id)}">Delete</button>
              </span>
            </div>`,
          )
          .join('')}
      </div>
      <p class="admin-note" id="admin-products-message"></p>`
    document.querySelector('#admin-product-search').addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase()
      document.querySelectorAll('.admin-table-row[data-search]').forEach((row) => {
        row.hidden = query.length > 0 && !row.dataset.search.includes(query)
      })
    })
    document.querySelector('#admin-add-product').addEventListener('click', () => bindAdminProductForm(null))
    document.querySelectorAll('[data-edit-id]').forEach((button) =>
      button.addEventListener('click', () =>
        bindAdminProductForm(products.find((p) => p.id === button.dataset.editId)),
      ),
    )
    document.querySelectorAll('[data-delete-id]').forEach((button) =>
      button.addEventListener('click', async () => {
        if (!window.confirm('Delete this product?')) return
        const { error } = await supabase.from('products').delete().eq('id', button.dataset.deleteId)
        if (error) {
          const msg = document.querySelector('#admin-products-message')
          if (msg) msg.textContent = error.message
          return
        }
        await loadProducts()
        renderAdminTab('products')
      }),
    )
    document.querySelectorAll('[data-stock-id]').forEach((input) =>
      input.addEventListener('change', async () => {
        const msg = document.querySelector('#admin-products-message')
        const { error } = await supabase
          .from('products')
          .update({ stock: Math.max(0, Number(input.value) || 0) })
          .eq('id', input.dataset.stockId)
        if (error) {
          if (msg) msg.textContent = error.message
          return
        }
        if (msg) msg.textContent = ''
        await loadProducts()
      }),
    )
  }

  if (tab === 'orders') {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, buyer_name, buyer_email, buyer_phone, buyer_address, notes, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
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
    const today = new Date().toDateString()
    const todayOrders = orders?.filter((o) => new Date(o.created_at).toDateString() === today) || []
    const revenueToday = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0)
    const completedOrders = orders?.filter((o) => o.status !== 'cancelled') || []
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const avgOrderValue = completedOrders.length ? totalRevenue / completedOrders.length : 0

    content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">FULFILLMENT</span><h2>Orders</h2></div></div>
      <div class="admin-metrics">
        <div><span>Orders today</span><strong>${todayOrders.length}</strong></div>
        <div><span>Awaiting shipment</span><strong class="warning">${orders?.filter((o) => o.status === 'pending').length || 0}</strong></div>
        <div><span>Revenue today</span><strong>${revenueToday.toFixed(0)} €</strong></div>
        <div><span>Total revenue (last 50)</span><strong>${totalRevenue.toFixed(0)} €</strong></div>
        <div><span>Avg. order value</span><strong>${avgOrderValue.toFixed(0)} €</strong></div>
      </div>
      <div class="admin-table cols-5">${
        orders?.length
          ? `<div class="admin-table-head"><span>Order</span><span>Items</span><span>Buyer &amp; contact</span><span>Total</span><span>Status</span></div>
            ${orders
              .map(
                (order) => `<div class="admin-table-row admin-order-row">
                  <code>#${escapeHtml(order.id)}<br><small>${new Date(order.created_at).toLocaleDateString('lv-LV')}</small></code>
                  <span>${escapeHtml((itemsByOrder[order.id] || []).join(', ') || '-')}</span>
                  <div class="order-buyer-cell">
                    <strong>${escapeHtml(order.buyer_name)}</strong>
                    ${order.buyer_email ? `<a href="mailto:${escapeHtml(order.buyer_email)}">${escapeHtml(order.buyer_email)}</a>` : ''}
                    ${order.buyer_phone ? `<span>${escapeHtml(order.buyer_phone)}</span>` : ''}
                    ${order.buyer_address ? `<span>${escapeHtml(order.buyer_address)}</span>` : ''}
                    ${order.notes ? `<em>Note: ${escapeHtml(order.notes)}</em>` : ''}
                  </div>
                  <b>${Number(order.total).toFixed(2)} €</b>
                  <select class="admin-select" data-order-status="${escapeHtml(order.id)}" aria-label="Order #${escapeHtml(order.id)} status">
                    ${['pending', 'paid', 'shipped', 'completed', 'cancelled']
                      .map((status) => `<option ${order.status === status ? 'selected' : ''}>${status}</option>`)
                      .join('')}
                  </select>
                </div>`,
              )
              .join('')}`
          : '<p class="admin-note">No orders yet. Customers submit order requests from the cart so you can arrange payment and delivery directly.</p>'
      }</div>
      <p class="admin-note" id="admin-orders-message"></p>`
    document.querySelectorAll('[data-order-status]').forEach((select) => {
      select.dataset.prevStatus = select.value
      select.addEventListener('change', async () => {
        const msg = document.querySelector('#admin-orders-message')
        const { error } = await supabase
          .from('orders')
          .update({ status: select.value })
          .eq('id', select.dataset.orderStatus)
        if (error) {
          select.value = select.dataset.prevStatus
          if (msg) msg.textContent = error.message
          return
        }
        select.dataset.prevStatus = select.value
        if (msg) msg.textContent = ''
      })
    })
  }

  if (tab === 'listings') {
    const { data: rows } = await supabase
      .from('listings')
      .select('id, title, brand, model, price, location, status')
      .neq('status', 'removed')
      .order('created_at', { ascending: false })
      .limit(50)
    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">COMMUNITY</span><h2>Community listings</h2></div>
        <span class="admin-count">${rows?.length || 0} listings</span>
      </div>
      <p class="admin-note">New listings publish automatically — remove any that don't belong. Click a listing to see full details.</p>
      <div id="admin-listing-detail"></div>
      <div class="moderation-list">${
        rows?.length
          ? rows
              .map(
                (row) => `<div class="moderation-row" data-view-id="${escapeHtml(row.id)}">
                  <div>
                    <strong>${escapeHtml(row.title)}</strong>
                    <small>${escapeHtml(row.brand || '-')} ${escapeHtml(row.model || '')} · ${escapeHtml(row.location || '-')} · ${Number(row.price)} € · <span class="status-pill">${escapeHtml(row.status)}</span></small>
                  </div>
                  <div>
                    ${row.status === 'pending' ? `<button class="approve-button" type="button" data-listing-action="active" data-listing-id="${escapeHtml(row.id)}">Approve</button>` : ''}
                    <button class="reject-button" type="button" data-listing-action="removed" data-listing-id="${escapeHtml(row.id)}">Remove</button>
                  </div>
                </div>`,
              )
              .join('')
          : '<p class="admin-note">No community listings yet.</p>'
      }</div>`
    document.querySelectorAll('[data-view-id]').forEach((row) =>
      row.addEventListener('click', (event) => {
        if (event.target.closest('button')) return
        showListingDetail(row.dataset.viewId)
      }),
    )
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
      <div id="admin-listing-detail"></div>
      <p class="form-message" id="admin-reports-message">${error ? escapeHtml(error.message) : ''}</p>
      <div class="moderation-list">${
        reports?.length
          ? reports
              .map((rep) => {
                const listing = listingById[rep.listing_id]
                const reporter = rep.reporter_id ? reporterById[rep.reporter_id] || 'User' : 'Deleted user'
                return `<div class="moderation-row" data-report-view-id="${escapeHtml(rep.listing_id)}">
                  <div>
                    <strong>${escapeHtml(listing?.title || `Listing #${rep.listing_id}`)} ${listing?.status ? `<span class="status-pill">${escapeHtml(listing.status)}</span>` : ''}</strong>
                    <small>${escapeHtml(rep.reason)}</small>
                    <small>Reported by ${escapeHtml(reporter)} · ${new Date(rep.created_at).toLocaleString('lv-LV')}</small>
                  </div>
                  <div class="row-actions">
                    ${listing && listing.status !== 'removed' ? `<button class="reject-button" type="button" data-report-remove-listing="${escapeHtml(rep.listing_id)}" data-report-id="${escapeHtml(rep.id)}">Remove listing</button>` : ''}
                    <button class="row-action" type="button" data-report-dismiss="${escapeHtml(rep.id)}">Dismiss</button>
                  </div>
                </div>`
              })
              .join('')
          : '<p class="admin-note">No open reports.</p>'
      }</div>`
    content.querySelectorAll('[data-report-view-id]').forEach((row) =>
      row.addEventListener('click', (event) => {
        if (event.target.closest('button')) return
        showListingDetail(row.dataset.reportViewId)
      }),
    )
    content.querySelectorAll('[data-report-dismiss]').forEach((button) =>
      button.addEventListener('click', async () => {
        const msg = document.querySelector('#admin-reports-message')
        const { error: delError } = await supabase.from('reports').delete().eq('id', button.dataset.reportDismiss)
        if (delError) {
          if (msg) msg.textContent = delError.message
          return
        }
        renderAdminTab('reports')
      }),
    )
    content.querySelectorAll('[data-report-remove-listing]').forEach((button) =>
      button.addEventListener('click', async () => {
        const msg = document.querySelector('#admin-reports-message')
        const listingId = button.dataset.reportRemoveListing
        const reportId = button.dataset.reportId
        const { error: updError } = await supabase.from('listings').update({ status: 'removed' }).eq('id', listingId)
        if (updError) {
          if (msg) msg.textContent = updError.message
          return
        }
        await supabase.from('reports').delete().eq('id', reportId)
        notifyEmail('listing_status', { listingId, status: 'removed' })
        renderAdminTab('reports')
      }),
    )
  }

  if (tab === 'tasks') {
    const { data: staff } = await supabase
      .from('profiles')
      .select('display_name, username, role, city')
      .in('role', STAFF_ROLES)
      .order('created_at', { ascending: true })
    content.innerHTML = `<div class="admin-heading">
        <div><span class="admin-overline">OPERATIONS</span><h2>Team</h2></div>
        <button class="admin-action" id="admin-add-employee" type="button">+ Add employee</button>
      </div>
      <p class="admin-note">Staff accounts with admin panel access (managed via Supabase Auth &amp; profiles.role).</p>
      <div class="admin-table">
        <div class="admin-table-head"><span>Name</span><span>Username</span><span>Role</span><span>City</span></div>
        ${
          staff?.length
            ? staff
                .map(
                  (person) => `<div class="admin-table-row">
                    <strong>${escapeHtml(person.display_name || person.username || 'Staff')}</strong>
                    <span>${escapeHtml(person.username || '-')}</span>
                    <span class="status-pill">${escapeHtml(ROLE_LABELS[person.role] || person.role)}</span>
                    <span>${escapeHtml(person.city || '-')}</span>
                  </div>`,
                )
                .join('')
            : '<p class="admin-note">No staff profiles found.</p>'
        }
      </div>`
  }

  if (tab === 'settings') {
    const adminEmail = (await supabase.auth.getUser()).data.user?.email || ''
    content.innerHTML = `<div class="admin-heading"><div><span class="admin-overline">CONFIGURATION</span><h2>Settings</h2></div></div>
      <div class="settings-card">
        <h3>Account</h3>
        <label>Admin e-mail<input value="${escapeHtml(adminEmail)}" readonly></label>
        <label>Role<input value="${escapeHtml(roleLabel)}" readonly></label>
      </div>
      <div class="settings-card">
        <h3>Store</h3>
        <label>Low stock alert threshold<input value="2" readonly></label>
        <label>Free shipping threshold<input value="150 €" readonly></label>
        <p class="admin-note">These thresholds are currently configured in code. A database-backed store settings table can be added later.</p>
      </div>`
  }

  bindListingActionButtons(content)
  document.querySelector('#admin-add-employee')?.addEventListener('click', () => {
    window.alert(
      'Employee accounts can be added from Supabase Authentication. Then set their role (manager / warehouse / fulfillment) on their row in the profiles table to give them admin access.',
    )
  })
}

function bindListingActionButtons(scope = document) {
  scope.querySelectorAll('[data-listing-action]').forEach((button) =>
    button.addEventListener('click', async () => {
      const { error } = await supabase
        .from('listings')
        .update({ status: button.dataset.listingAction })
        .eq('id', button.dataset.listingId)
      if (error) {
        const holder = document.querySelector('#admin-listing-detail')
        if (holder) holder.innerHTML = `<p class="form-message">${escapeHtml(error.message)}</p>`
        return
      }
      notifyEmail('listing_status', {
        listingId: button.dataset.listingId,
        status: button.dataset.listingAction,
      })
      renderAdminTab('listings')
    }),
  )
}

async function showListingDetail(id) {
  const holder = document.querySelector('#admin-listing-detail')
  if (!holder) return
  holder.innerHTML = '<p class="admin-note">Loading...</p>'
  const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()
  if (!listing) {
    holder.innerHTML = '<p class="admin-note">Listing not found.</p>'
    return
  }
  const [{ data: profile }, { data: images }] = await Promise.all([
    supabase.from('profiles').select('display_name, phone, city, username').eq('id', listing.user_id).single(),
    supabase.from('listing_images').select('storage_path').eq('listing_id', id).order('sort_order'),
  ])
  const imageUrls = (images || [])
    .map((image) => String(image.storage_path || '').trim())
    .filter(Boolean)
    .map((path) => safeUrl(supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl))
    .filter(Boolean)
  holder.innerHTML = `<div class="admin-product-form">
    <h3>${escapeHtml(listing.title)}</h3>
    <div class="detail-data">
      <span>STATUS<strong>${escapeHtml(listing.status)}</strong></span>
      <span>PRICE<strong>${Number(listing.price).toFixed(2)} €</strong></span>
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
    ${
      imageUrls.length
        ? `<div class="admin-listing-images">${imageUrls.map((url) => `<img src="${escapeHtml(url)}" alt="">`).join('')}</div>`
        : '<p class="admin-note">No photos uploaded.</p>'
    }
    <div class="form-actions">
      ${listing.status === 'pending' ? `<button class="approve-button" type="button" data-listing-action="active" data-listing-id="${escapeHtml(listing.id)}">Approve</button>` : ''}
      <button class="reject-button" type="button" data-listing-action="removed" data-listing-id="${escapeHtml(listing.id)}">Remove</button>
      <button class="text-button" type="button" id="admin-listing-detail-close">Close</button>
    </div>
  </div>`
  document.querySelector('#admin-listing-detail-close').addEventListener('click', () => {
    holder.innerHTML = ''
  })
  bindListingActionButtons(holder)
}
