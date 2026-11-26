import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildProductSearchBlob,
  escapeHtml,
  formatPrice,
  matchesProductionYear,
  qrCodeToImgSrc,
  safeUrl,
  sanitizeUploadFilename,
  slugify,
  validateImageFiles,
} from '../src/utils.js'
import { canAddProductToCart, getAvailableStock, groupCartItems } from '../src/cart.js'
import { FALLBACK_PRODUCTS } from '../src/data.js'

test('escapeHtml neutralizes HTML special characters', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('xss')">&`),
    '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;',
  )
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(42), '42')
})

test('safeUrl allows safe http/https/relative/data:image URLs and rejects javascript/html payloads', () => {
  assert.equal(safeUrl('https://images.unsplash.com/photo-1.jpg'), 'https://images.unsplash.com/photo-1.jpg')
  assert.equal(safeUrl('/favicon.svg'), '/favicon.svg')
  assert.equal(safeUrl('data:image/png;base64,abc'), 'data:image/png;base64,abc')
  assert.equal(safeUrl('javascript:alert(1)'), '')
  assert.equal(safeUrl('JAVASCRIPT:alert(1)'), '')
  assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), '')
  assert.equal(safeUrl('vbscript:msgbox(1)'), '')
})

test('qrCodeToImgSrc safely wraps raw SVG markup as an image data URI', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'
  const src = qrCodeToImgSrc(svg)
  assert.ok(src.startsWith('data:image/svg+xml;charset=utf-8,'))
  assert.equal(qrCodeToImgSrc('https://example.com/qr.png'), 'https://example.com/qr.png')
})

test('slugify strips diacritics and non-alphanumerics', () => {
  assert.equal(slugify('Riteņi & diski — 18"'), 'riteni-diski-18')
  assert.equal(slugify(''), 'detala')
})

test('formatPrice formats EUR prices with Latvian comma', () => {
  assert.equal(formatPrice(249), '249,00 €')
  assert.equal(formatPrice(12.5), '12,50 €')
})

test('buildProductSearchBlob includes production_year so year filter matches', () => {
  const blob = buildProductSearchBlob({
    name: 'BMW F10 lukturis',
    brand: 'BMW',
    model: '5. sērija F10',
    production_year: '2010–2017',
    oem: '63117203298',
  })
  assert.ok(blob.includes('2010'))
  assert.ok(blob.includes('2017'))
  assert.ok(blob.includes('63117203298'))
})

test('sanitizeUploadFilename strips Latvian characters and unsafe extensions', () => {
  const safe = sanitizeUploadFilename('Priekšējais lukturis (1).PNG', 2)
  assert.match(safe, /^\d+-2-prieksejais-lukturis-1\.png$/)
  const fallbackExt = sanitizeUploadFilename('evil.svg', 0)
  assert.match(fallbackExt, /^\d+-0-evil\.jpg$/)
})

test('validateImageFiles enforces file type, size, and max count', () => {
  const goodFile = { name: 'photo.jpg', type: 'image/jpeg', size: 1024 }
  assert.equal(validateImageFiles([goodFile]).error, null)
  assert.equal(validateImageFiles([goodFile]).valid.length, 1)

  const badType = { name: 'script.js', type: 'application/javascript', size: 100 }
  assert.ok(validateImageFiles([badType]).error)

  const tooBig = { name: 'huge.png', type: 'image/png', size: 6 * 1024 * 1024 }
  assert.ok(validateImageFiles([tooBig]).error)

  const tooMany = Array.from({ length: 11 }, () => goodFile)
  assert.ok(validateImageFiles(tooMany).error)
  assert.ok(validateImageFiles([goodFile, goodFile], { existingCount: 9 }).error)
})

test('cart stock checks and grouping prevent exceeding available inventory', () => {
  const p1 = { id: 'p1', name: 'Part 1', price: 100, stock: 1 }
  const p2 = { id: 'p2', name: 'Part 2', price: 50, stock: 2 }
  const p0 = { id: 'p0', name: 'Sold out', price: 10, stock: 0 }

  assert.equal(getAvailableStock(p0), 0)
  assert.deepEqual(canAddProductToCart([], p0), { ok: false, reason: 'out_of_stock' })
  assert.deepEqual(canAddProductToCart([], p1), { ok: true, reason: null })
  assert.deepEqual(canAddProductToCart([p1], p1), { ok: false, reason: 'max_stock' })
  assert.deepEqual(canAddProductToCart([p2], p2), { ok: true, reason: null })
  assert.deepEqual(canAddProductToCart([p2, p2], p2), { ok: false, reason: 'max_stock' })

  const grouped = groupCartItems([p1, p2, p2])
  assert.equal(grouped.length, 2)
  assert.equal(grouped[0].quantity, 1)
  assert.equal(grouped[1].quantity, 2)
})

test('matchesProductionYear supports year ranges like 2010–2017 and substrings', () => {
  assert.equal(matchesProductionYear('2010–2017', '2012'), true)
  assert.equal(matchesProductionYear('2010-2017', '2010'), true)
  assert.equal(matchesProductionYear('2010–2017', '2017'), true)
  assert.equal(matchesProductionYear('2010–2017', '2009'), false)
  assert.equal(matchesProductionYear('2010–2017', '2018'), false)
  assert.equal(matchesProductionYear('2014', '2014'), true)
  assert.equal(matchesProductionYear('2010–2017', ''), true)
  const matching2012 = FALLBACK_PRODUCTS.filter((p) => matchesProductionYear(p.production_year, '2012'))
  assert.ok(matching2012.length >= 4)
})

test('all fallback products and rendered markup pass basic safety and link invariants', async () => {
  const { productCardMarkup, categoryPage } = await import('../src/catalog.js')
  const { homeMarkup, STATIC_PAGES } = await import('../src/pages.js')

  const home = homeMarkup()
  assert.ok(home.includes('href="#catalog">SKATĪT VISUS'))
  assert.ok(home.includes('data-year="2010–2017"'))

  const xssCard = productCardMarkup(
    {
      id: 'x"><script>',
      name: '<img src=x onerror=alert(1)>',
      price: 10,
      stock: 0,
      image: 'javascript:alert(1)',
      category: 'Dzinējs',
    },
    0,
    false,
  )
  assert.ok(!xssCard.includes('<script>'))
  assert.ok(!xssCard.includes('javascript:alert'))
  assert.ok(xssCard.includes('NAV NOLIKTAVĀ'))
  assert.ok(xssCard.includes('disabled'))

  const xssCategory = categoryPage('<script>alert(1)</script>')
  assert.ok(!xssCategory.includes('<script>alert(1)</script>'))
  assert.ok(STATIC_PAGES.about.includes('PAR TRACKPARTS'))
})

test('index.html CSP disallows inline scripts and allows Supabase + fonts', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes("script-src 'self'"))
  assert.ok(!html.includes("script-src 'self' 'unsafe-inline'"))
  assert.ok(html.includes('https://*.supabase.co'))
})
