// Pure helpers shared across storefront, marketplace, cart, and admin modules.

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char])
}

// Rejects javascript:, vbscript:, and arbitrary data: payloads when
// interpolating URLs into href/src attributes.
export function safeUrl(url, fallback = '') {
  const raw = String(url ?? '').trim()
  if (!raw) return fallback
  if (raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../') || raw.startsWith('#')) {
    return raw
  }
  if (/^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);/i.test(raw)) {
    return raw
  }
  try {
    const parsed = new URL(raw)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return raw
  } catch {
    // invalid URL
  }
  return fallback
}

// Renders raw SVG markup (such as Supabase MFA TOTP QR codes) inside an <img>
// data URI instead of dumping raw SVG XML directly into innerHTML, so browsers
// will never execute any scripts inside the SVG document.
export function qrCodeToImgSrc(qrCode) {
  const raw = String(qrCode ?? '').trim()
  if (!raw) return ''
  if (/^(data:image\/|https?:)/i.test(raw)) return safeUrl(raw)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw)}`
}

export function slugify(text) {
  const stripped = (text || 'detala').toString().toLowerCase().trim().normalize('NFD')
  let plain = ''
  for (const char of stripped) {
    const code = char.codePointAt(0)
    if (code < 0x300 || code > 0x36f) plain += char
  }
  return plain.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'detala'
}

export function formatPrice(price) {
  return `${Number(price || 0).toFixed(2).replace('.', ',')} €`
}

export function stockLabel(stock) {
  return `${stock ?? 0} gab.`
}

export function buildProductSearchBlob(product) {
  return [
    product.name,
    product.code,
    product.oem,
    product.brand,
    product.model,
    product.category,
    product.condition,
    product.production_year,
    product.engine,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

// Matches both exact substrings ("2010") and years inside ranges like "2010–2017" or "2010-2017".
export function matchesProductionYear(productionYear, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  const raw = String(productionYear ?? '').trim().toLowerCase()
  if (!raw) return false
  if (raw.includes(q)) return true
  if (/^\d{4}$/.test(q)) {
    const target = Number(q)
    const range = raw.match(/(\d{4})\s*[-–—]\s*(\d{4})/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      return target >= Math.min(start, end) && target <= Math.max(start, end)
    }
  }
  return false
}

export function honeypotFieldMarkup() {
  return `<label class="hp-field" aria-hidden="true"><input type="text" name="hp_field" tabindex="-1" autocomplete="off"></label>`
}

export function isSpamSubmit(formData) {
  return Boolean(formData.get('hp_field'))
}

// Trigger points for transactional email (order placed, listing status).
export function notifyEmail(type, payload) {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.info(`[notifyEmail] ${type}`, payload)
  }
}

const ALLOWED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'])
export const MAX_UPLOAD_FILES = 10
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB

export function sanitizeUploadFilename(filename, index = 0) {
  const raw = String(filename || 'image.jpg')
  const lastDot = raw.lastIndexOf('.')
  const rawExt = lastDot > 0 ? raw.slice(lastDot + 1).toLowerCase() : ''
  const ext = ALLOWED_IMAGE_EXTS.has(rawExt) ? rawExt : 'jpg'
  const stem = slugify(lastDot > 0 ? raw.slice(0, lastDot) : raw).slice(0, 40) || 'image'
  return `${Date.now()}-${index}-${stem}.${ext}`
}

export function validateImageFiles(
  files,
  { maxFiles = MAX_UPLOAD_FILES, maxBytes = MAX_UPLOAD_BYTES, existingCount = 0 } = {},
) {
  const nonEmpty = [...(files || [])].filter((file) => file && file.size > 0)
  if (existingCount + nonEmpty.length > maxFiles) {
    return {
      valid: [],
      error: `Var pievienot ne vairāk kā ${maxFiles} bildes vienam sludinājumam.`,
    }
  }
  for (const file of nonEmpty) {
    const ext = String(file.name || '').split('.').pop()?.toLowerCase() || ''
    const mimeOk = typeof file.type === 'string' && file.type.startsWith('image/')
    const extOk = ALLOWED_IMAGE_EXTS.has(ext)
    if (!mimeOk && !extOk) {
      return {
        valid: [],
        error: `Nederīgs faila formāts (${file.name || 'fails'}). Atļautas tikai bildes (JPG, PNG, WebP).`,
      }
    }
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024))
      return {
        valid: [],
        error: `Bilde "${file.name || 'fails'}" ir pārāk liela. Maksimālais izmērs ir ${mb} MB.`,
      }
    }
  }
  return { valid: nonEmpty, error: null }
}
