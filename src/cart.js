import { supabase } from './lib/supabase.js'
import { getProducts, whenProductsReady } from './data.js'
import { escapeHtml, formatPrice, honeypotFieldMarkup, isSpamSubmit, notifyEmail } from './utils.js'
import { primeAndTranslate, translatePage, isEnglish } from './i18n.js'
import { pulseCartBadge, showToast } from './fx.js'

const cartItems = []
let cartOwner = 'guest'
let persistQueue = Promise.resolve()
let syncQueue = Promise.resolve()

function cartStorageKey(owner) {
  return `trackparts-cart:${owner}`
}

// Pure helpers exported for unit tests
export function getAvailableStock(product) {
  if (!product) return 0
  return Math.max(0, Number(product.stock ?? 0))
}

export function canAddProductToCart(items, product) {
  const stock = getAvailableStock(product)
  if (stock <= 0) return { ok: false, reason: 'out_of_stock' }
  const currentQty = items.filter((item) => item.id === product.id).length
  if (currentQty >= stock) return { ok: false, reason: 'max_stock' }
  return { ok: true, reason: null }
}

export function groupCartItems(items) {
  const map = new Map()
  for (const product of items) {
    const existing = map.get(product.id)
    if (existing) existing.quantity += 1
    else map.set(product.id, { product, quantity: 1 })
  }
  return [...map.values()]
}

export function getCartQtyForProduct(productId) {
  return cartItems.filter((item) => item.id === productId).length
}

function updateCartBadge() {
  const el = document.querySelector('#cart-count')
  if (el) el.textContent = String(cartItems.length)
}

// Serialize DB/localStorage writes so rapid +/- clicks never race and duplicate rows.
function persistCart() {
  const snapshotIds = cartItems.map((product) => product.id)
  const ownerSnapshot = cartOwner
  persistQueue = persistQueue.then(async () => {
    if (ownerSnapshot !== 'guest' && supabase) {
      try {
        await supabase.from('cart_items').delete().eq('user_id', ownerSnapshot)
        if (snapshotIds.length) {
          await supabase
            .from('cart_items')
            .insert(snapshotIds.map((productId) => ({ user_id: ownerSnapshot, product_id: productId })))
        }
      } catch {
        // sync failed (e.g. table unavailable); local state stays accurate for this session
      }
      return
    }
    try {
      localStorage.setItem(cartStorageKey(ownerSnapshot), JSON.stringify(snapshotIds))
    } catch {
      // storage unavailable (private mode, quota)
    }
  })
  return persistQueue
}

async function loadCartForOwnerNow(owner) {
  await whenProductsReady()
  cartOwner = owner || 'guest'
  cartItems.length = 0
  const products = getProducts()
  const addCapped = (id) => {
    const product = products.find((item) => item.id === id)
    if (product && canAddProductToCart(cartItems, product).ok) cartItems.push(product)
  }
  if (cartOwner !== 'guest' && supabase) {
    try {
      const { data } = await supabase.from('cart_items').select('product_id').eq('user_id', cartOwner)
      ;(data || []).forEach((row) => addCapped(row.product_id))
    } catch {
      // cart_items unavailable
    }
  } else {
    try {
      const ids = JSON.parse(localStorage.getItem(cartStorageKey(cartOwner)) || '[]')
      ids.forEach((id) => addCapped(id))
    } catch {
      // corrupt storage
    }
  }
  updateCartBadge()
  renderCart()
}

export function loadCartForOwner(owner) {
  syncQueue = syncQueue.then(() => loadCartForOwnerNow(owner))
  return syncQueue
}

export function switchCartOwner(userId) {
  syncQueue = syncQueue.then(async () => {
    await whenProductsReady()
    const nextOwner = userId || 'guest'
    if (nextOwner !== 'guest' && cartOwner === 'guest' && cartItems.length && supabase) {
      const guestIds = cartItems.map((product) => product.id)
      try {
        const { data: existingRows, error: fetchError } = await supabase
          .from('cart_items')
          .select('product_id')
          .eq('user_id', nextOwner)
        if (!fetchError) {
          const products = getProducts()
          const merged = []
          const tryAdd = (id) => {
            const product = products.find((item) => item.id === id)
            if (product && canAddProductToCart(merged, product).ok) merged.push(product)
          }
          ;(existingRows || []).forEach((row) => tryAdd(row.product_id))
          const existingCount = merged.length
          guestIds.forEach((id) => tryAdd(id))
          const toInsert = merged.slice(existingCount)
          let insertError = null
          if (toInsert.length) {
            const res = await supabase
              .from('cart_items')
              .insert(toInsert.map((product) => ({ user_id: nextOwner, product_id: product.id })))
            insertError = res.error
          }
          if (!insertError) localStorage.removeItem(cartStorageKey('guest'))
        }
      } catch {
        // merge failed
      }
    }
    await loadCartForOwnerNow(nextOwner)
  })
  return syncQueue
}

export function addToCart(product) {
  const check = canAddProductToCart(cartItems, product)
  if (!check.ok) {
    showToast(
      check.reason === 'out_of_stock'
        ? 'Šī detaļa pašlaik nav noliktavā.'
        : 'Sasniegts pieejamais atlikums noliktavā.',
      { isWarning: true },
    )
    return check
  }
  cartItems.push(product)
  updateCartBadge()
  pulseCartBadge()
  renderCart()
  persistCart()
  showToast(`Pievienots grozam: ${product.name}`, {
    actionLabel: 'SKATĪT GROZU ↗',
    onAction: () => document.querySelector('#cart-panel')?.classList.add('is-open'),
  })
  return check
}

function decrementCartItem(productId) {
  const idx = cartItems.findIndex((item) => item.id === productId)
  if (idx === -1) return
  cartItems.splice(idx, 1)
  updateCartBadge()
  renderCart()
  persistCart()
}

function removeCartItem(productId) {
  for (let i = cartItems.length - 1; i >= 0; i -= 1) {
    if (cartItems[i].id === productId) cartItems.splice(i, 1)
  }
  updateCartBadge()
  renderCart()
  persistCart()
}

export function clearCart() {
  cartItems.length = 0
  updateCartBadge()
  renderCart()
  persistCart()
}

export function renderCart() {
  const itemsEl = document.querySelector('#cart-items')
  const totalEl = document.querySelector('#cart-total')
  if (!itemsEl || !totalEl) return
  const total = cartItems.reduce((sum, product) => sum + Number(product.price), 0)
  totalEl.textContent = formatPrice(total)
  const grouped = groupCartItems(cartItems)
  if (!grouped.length) {
    itemsEl.innerHTML = '<p id="cart-empty">Grozs ir tukšs.</p>'
  } else {
    itemsEl.innerHTML = grouped
      .map(({ product, quantity }) => {
        const stock = getAvailableStock(product)
        const atMax = quantity >= stock
        return `<div class="cart-item">
          <div class="cart-item-info">
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.code || '')}</small>
            <div class="cart-item-controls">
              <button class="cart-qty-btn" type="button" data-cart-dec="${escapeHtml(product.id)}" aria-label="Samazināt daudzumu">−</button>
              <span class="cart-qty-val">${quantity}</span>
              <button class="cart-qty-btn" type="button" data-cart-inc="${escapeHtml(product.id)}" ${atMax ? 'disabled' : ''} aria-label="Palielināt daudzumu">+</button>
              <button class="cart-remove-btn" type="button" data-cart-remove="${escapeHtml(product.id)}" aria-label="Izņemt no groza">×</button>
            </div>
          </div>
          <b>${formatPrice(Number(product.price) * quantity)}</b>
        </div>`
      })
      .join('')
    itemsEl.querySelectorAll('[data-cart-dec]').forEach((btn) =>
      btn.addEventListener('click', () => decrementCartItem(btn.dataset.cartDec)),
    )
    itemsEl.querySelectorAll('[data-cart-inc]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const product = getProducts().find((item) => item.id === btn.dataset.cartInc)
        if (product) addToCart(product)
      }),
    )
    itemsEl.querySelectorAll('[data-cart-remove]').forEach((btn) =>
      btn.addEventListener('click', () => removeCartItem(btn.dataset.cartRemove)),
    )
  }
  if (isEnglish()) {
    translatePage()
    primeAndTranslate()
  }
}

function checkoutFormMarkup() {
  const total = cartItems.reduce((sum, product) => sum + Number(product.price), 0)
  return `<div class="section-kicker">PASŪTĪJUMA PIEPRASĪJUMS</div>
    <h2>Pabeidz <em>pasūtījumu.</em></h2>
    <form id="checkout-form">
      ${honeypotFieldMarkup()}
      <p class="form-message">Apmaksa tiešsaistē vēl nav pieejama — pēc pieprasījuma nosūtīšanas mēs sazināsimies pa e-pastu, lai vienotos par apmaksu un piegādi.</p>
      <label>VĀRDS, UZVĀRDS<input name="name" required></label>
      <label>E-PASTS<input name="email" type="email" required></label>
      <label>TĀLRUNIS<input name="phone"></label>
      <label>PIEGĀDES ADRESE<input name="address" required></label>
      <label>PIEZĪMES<textarea name="notes" rows="3"></textarea></label>
      <div class="form-actions">
        <button class="button button-light" type="submit"><span>NOSŪTĪT</span> (${formatPrice(total)}) ↗</button>
        <button class="text-button" type="button" id="checkout-back">← ATPAKAĻ</button>
      </div>
      <p class="form-message" id="checkout-message"></p>
    </form>`
}

export function closeCartPanel() {
  document.querySelector('#cart-panel')?.classList.remove('is-open')
}

export function bindCartControls({ onOpen } = {}) {
  document.querySelector('.cart-button')?.addEventListener('click', () => {
    onOpen?.()
    document.querySelector('#cart-panel')?.classList.toggle('is-open')
  })
  document.querySelector('.cart-close')?.addEventListener('click', closeCartPanel)
  document.querySelector('#clear-cart')?.addEventListener('click', clearCart)

  document.querySelector('#checkout-button')?.addEventListener('click', () => {
    const cartView = document.querySelector('#cart-view')
    const checkoutView = document.querySelector('#checkout-view')
    if (!cartItems.length) {
      if (!document.querySelector('#cart-items .form-message')) {
        document
          .querySelector('#cart-items')
          .insertAdjacentHTML('beforeend', '<p class="form-message">Pievieno detaļu grozam vispirms.</p>')
      }
      if (isEnglish()) translatePage()
      return
    }
    cartView.hidden = true
    checkoutView.hidden = false
    checkoutView.innerHTML = checkoutFormMarkup()
    if (isEnglish()) translatePage()
    document.querySelector('#checkout-back')?.addEventListener('click', () => {
      checkoutView.hidden = true
      cartView.hidden = false
    })
    document.querySelector('#checkout-form')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const message = document.querySelector('#checkout-message')
      if (!supabase) {
        message.textContent = 'Pasūtījumu sistēma nav pieejama.'
        return
      }
      const data = new FormData(event.target)
      if (isSpamSubmit(data)) return
      const grouped = groupCartItems(cartItems)
      const total = cartItems.reduce((sum, product) => sum + Number(product.price), 0)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          buyer_name: data.get('name'),
          buyer_email: data.get('email'),
          buyer_phone: data.get('phone'),
          buyer_address: data.get('address'),
          notes: data.get('notes'),
          total,
        })
        .select()
        .single()
      if (error) {
        message.textContent = error.message
        return
      }
      await supabase.from('order_items').insert(
        grouped.map(({ product, quantity }) => ({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity,
        })),
      )
      notifyEmail('order_placed', { orderId: order.id, email: data.get('email'), total })
      checkoutView.innerHTML = `<div class="section-kicker">PALDIES!</div>
        <h2>Pasūtījums <em>saņemts.</em></h2>
        <p class="form-message">Pasūtījums #${escapeHtml(order.id)} saņemts. Mēs sazināsimies pa e-pastu ${escapeHtml(data.get('email'))}, lai vienotos par apmaksu un piegādi.</p>
        <button class="text-button" type="button" id="checkout-close">AIZVĒRT</button>`
      if (isEnglish()) translatePage()
      document.querySelector('#checkout-close')?.addEventListener('click', () => {
        checkoutView.hidden = true
        cartView.hidden = false
        closeCartPanel()
      })
      clearCart()
    })
  })
}
