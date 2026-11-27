// Visual micro-interactions: scroll telemetry bar, sticky header state,
// hero pointer spotlight/parallax, and cart toast notifications.
import { escapeHtml } from './utils.js'
import { isEnglish, translatePage } from './i18n.js'

let fxBound = false
let toastTimer = null
let cachedWheelCutoutUrl = null

// Flood-fills only the 10 dark interior spoke openings (5 wide + 5 narrow twin-spoke
// slots) to true alpha transparency so the fixed red caliper & spinning drilled rotor
// show cleanly behind the solid metallic BMW Style 37 spokes.
function applyWheelSpokeCutout(img) {
  if (!img || img.dataset.cutoutApplied === '1') return
  if (cachedWheelCutoutUrl) {
    img.dataset.cutoutApplied = '1'
    img.src = cachedWheelCutoutUrl
    return
  }
  const run = () => {
    if (!img.isConnected || img.dataset.cutoutApplied === '1' || !img.naturalWidth) return
    try {
      const size = 640
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0, size, size)
      const imageData = ctx.getImageData(0, 0, size, size)
      const data = imageData.data

      const cx = size / 2
      const cy = size / 2
      const minR = size * 0.182
      const maxR = size * 0.394
      const minR2 = minR * minR
      const maxR2 = maxR * maxR

      const visited = new Uint8Array(size * size)
      const mask = new Uint8Array(size * size)
      const queue = new Int32Array(size * size)
      let head = 0
      let tail = 0

      const isWindowDark = (idx) => {
        const p = idx * 4
        const r = data[p]
        const g = data[p + 1]
        const b = data[p + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const maxC = r > g ? (r > b ? r : b) : g > b ? g : b
        return lum < 44 && maxC < 64
      }

      const trySeed = (x, y) => {
        if (x < 0 || x >= size || y < 0 || y >= size) return
        const idx = y * size + x
        if (visited[idx]) return
        const dx = x - cx
        const dy = y - cy
        const d2 = dx * dx + dy * dy
        if (d2 < minR2 || d2 > maxR2) return
        if (!isWindowDark(idx)) return
        visited[idx] = 1
        mask[idx] = 1
        queue[tail++] = idx
      }

      // 5 narrow twin-spoke slots (-90° + k*72°) + 5 wide windows (-54° + k*72°)
      for (let k = 0; k < 5; k++) {
        const slotAngle = ((-90 + k * 72) * Math.PI) / 180
        const wideAngle = ((-54 + k * 72) * Math.PI) / 180
        for (const frac of [0.24, 0.28, 0.32, 0.35]) {
          trySeed(Math.round(cx + Math.cos(slotAngle) * size * frac), Math.round(cy + Math.sin(slotAngle) * size * frac))
          trySeed(Math.round(cx + Math.cos(wideAngle) * size * frac), Math.round(cy + Math.sin(wideAngle) * size * frac))
        }
      }

      while (head < tail) {
        const idx = queue[head++]
        const x = idx % size
        const y = (idx - x) / size
        if (x > 0) trySeed(x - 1, y)
        if (x + 1 < size) trySeed(x + 1, y)
        if (y > 0) trySeed(x, y - 1)
        if (y + 1 < size) trySeed(x, y + 1)
      }

      // Make flooded window pixels transparent, with a 2px luminance-feathered anti-alias edge
      for (let i = 0; i < size * size; i++) {
        if (mask[i]) {
          data[i * 4 + 3] = 0
        }
      }

      const edge = new Uint8Array(size * size)
      for (let y = 1; y < size - 1; y++) {
        const row = y * size
        for (let x = 1; x < size - 1; x++) {
          const i = row + x
          if (mask[i]) continue
          if (mask[i - 1] || mask[i + 1] || mask[i - size] || mask[i + size]) {
            edge[i] = 1
          }
        }
      }
      for (let i = 0; i < size * size; i++) {
        if (!edge[i]) continue
        const p = i * 4
        const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
        const alpha = Math.max(0, Math.min(255, Math.round(((lum - 30) / 48) * 255)))
        data[p + 3] = alpha
      }

      ctx.putImageData(imageData, 0, 0)
      cachedWheelCutoutUrl = canvas.toDataURL('image/png')
      img.dataset.cutoutApplied = '1'
      img.src = cachedWheelCutoutUrl
    } catch {
      // Fall back silently to original opaque wheel if canvas is blocked
    }
  }

  if (img.complete && img.naturalWidth > 0) run()
  else img.addEventListener('load', run, { once: true })
}

export function initGlobalFx() {
  if (fxBound || typeof window === 'undefined') return
  fxBound = true

  const progressBar = document.querySelector('#scroll-progress')
  const header = document.querySelector('.site-header')
  let ticking = false

  const updateScroll = () => {
    ticking = false
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const ratio = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0
    if (progressBar) progressBar.style.transform = `scaleX(${ratio})`
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 18)
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(updateScroll)
      }
    },
    { passive: true },
  )
  updateScroll()
}

export function bindHeroFx() {
  if (typeof window === 'undefined') return
  const hero = document.querySelector('.hero')
  if (!hero) return
  applyWheelSpokeCutout(hero.querySelector('.hero-wheel-img'))
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!window.matchMedia('(hover: hover)').matches) return

  const visualStage = hero.querySelector('.hero-wheel-stage') || hero.querySelector('.hero-visual img')
  const spec = hero.querySelector('.hero-spec')

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const nx = (x / rect.width - 0.5) * 2 // -1..1
    const ny = (y / rect.height - 0.5) * 2
    hero.style.setProperty('--mx', `${x.toFixed(1)}px`)
    hero.style.setProperty('--my', `${y.toFixed(1)}px`)
    hero.classList.add('has-pointer')
    if (visualStage) {
      visualStage.style.transform = `translate3d(${(nx * -12).toFixed(1)}px, ${(ny * -9).toFixed(1)}px, 0)`
    }
    if (spec) {
      spec.style.transform = `translate3d(${(nx * 6).toFixed(1)}px, ${(ny * 4).toFixed(1)}px, 0)`
    }
  })

  hero.addEventListener('pointerleave', () => {
    hero.classList.remove('has-pointer')
    if (visualStage) visualStage.style.transform = ''
    if (spec) spec.style.transform = ''
  })
}

export function pulseCartBadge() {
  const badge = document.querySelector('#cart-count')
  if (!badge) return
  badge.classList.remove('is-popping')
  void badge.offsetWidth
  badge.classList.add('is-popping')
}

export function showToast(title, { actionLabel, onAction, isWarning = false } = {}) {
  const host = document.querySelector('#toast-host')
  if (!host) return
  clearTimeout(toastTimer)
  host.innerHTML = `<div class="toast${isWarning ? ' is-warning' : ''}" role="status" aria-live="polite">
    <span class="toast-dot" aria-hidden="true"></span>
    <span class="toast-text">${escapeHtml(title)}</span>
    ${actionLabel ? `<button class="toast-action" type="button" id="toast-action-btn">${escapeHtml(actionLabel)}</button>` : ''}
  </div>`
  if (isEnglish()) translatePage()
  if (actionLabel && onAction) {
    document.querySelector('#toast-action-btn')?.addEventListener('click', () => {
      host.innerHTML = ''
      clearTimeout(toastTimer)
      onAction()
    })
  }
  requestAnimationFrame(() => host.querySelector('.toast')?.classList.add('is-visible'))
  toastTimer = setTimeout(() => {
    const el = host.querySelector('.toast')
    if (el) el.classList.remove('is-visible')
    setTimeout(() => {
      if (host.querySelector('.toast') === el) host.innerHTML = ''
    }, 260)
  }, 3200)
}
