// Visual micro-interactions: scroll telemetry bar, sticky header state,
// hero pointer spotlight/parallax, and cart toast notifications.
import { escapeHtml } from './utils.js'
import { isEnglish, translatePage } from './i18n.js'

let fxBound = false
let toastTimer = null

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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!window.matchMedia('(hover: hover)').matches) return

  const hero = document.querySelector('.hero')
  if (!hero) return
  const visualImg = hero.querySelector('.hero-visual img')
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
    if (visualImg) {
      visualImg.style.transform = `translate3d(${(nx * -10).toFixed(1)}px, ${(ny * -8).toFixed(1)}px, 0) scale(1.03)`
    }
    if (spec) {
      spec.style.transform = `translate3d(${(nx * 6).toFixed(1)}px, ${(ny * 4).toFixed(1)}px, 0)`
    }
  })

  hero.addEventListener('pointerleave', () => {
    hero.classList.remove('has-pointer')
    if (visualImg) visualImg.style.transform = ''
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
