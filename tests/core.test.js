import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildProductSearchBlob,
  escapeHtml,
  escapeIlikePattern,
  formatPrice,
  formatTelHref,
  matchesProductionYear,
  parseOptionalPrice,
  qrCodeToImgSrc,
  safeUrl,
  sanitizeUploadFilename,
  slugify,
  trapFocus,
  validateImageFiles,
  withSubmitLock,
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
  const { productCardMarkup, categoryPage, matchesConditionFilter, normalizeConditionLabel } = await import(
    '../src/catalog.js'
  )
  const { homeMarkup, notFoundMarkup, STATIC_PAGES } = await import('../src/pages.js')

  assert.equal(normalizeConditionLabel('Pārbaudīta'), 'Pārbaudīts')
  assert.equal(normalizeConditionLabel('Pārbaudīts'), 'Pārbaudīts')
  assert.equal(normalizeConditionLabel('Labs'), 'Labs')

  const home = homeMarkup()
  assert.ok(home.includes('href="#catalog">SKATĪT VISUS'))
  assert.ok(home.includes('data-year="2010–2017"'))
  assert.ok(home.includes('DETAĻAS, KURĀM VAR UZTICĒTIES'))
  assert.ok(home.includes('style37-wheel.jpg'))
  assert.ok(!home.includes('id="catalog-show-more"'))

  const notFound = notFoundMarkup('<script>xss</script>')
  assert.ok(notFound.includes('404 / LAPA NAV ATRASTA'))
  assert.ok(!notFound.includes('<script>xss</script>'))
  assert.ok(notFound.includes('href="#home"'))

  assert.equal(matchesConditionFilter('Ļoti labs', 'labs'), false)
  assert.equal(matchesConditionFilter('Labs', 'labs'), true)
  assert.equal(matchesConditionFilter('Ļoti labs', 'ļoti labs'), true)
  assert.equal(matchesConditionFilter('Pārbaudīta', 'pārbaudīt'), true)
  assert.equal(matchesConditionFilter('Pārbaudīts', 'pārbaudīt'), true)
  assert.equal(matchesConditionFilter('Ar defektu', ''), true)

  const xssCard = productCardMarkup(
    {
      id: 'x"><script>',
      name: '<img src=x onerror=alert(1)>',
      price: 10,
      stock: 0,
      image: 'javascript:alert(1)',
      category: 'Dzinējs',
      condition: 'Labs',
    },
    0,
    false,
  )
  assert.ok(!xssCard.includes('<script>'))
  assert.ok(!xssCard.includes('javascript:alert'))
  assert.ok(xssCard.includes('data-condition="labs"'))
  assert.ok(xssCard.includes('class="product-card-link"'))
  assert.ok(xssCard.includes('NAV NOLIKTAVĀ'))
  assert.ok(xssCard.includes('disabled'))

  const xssCategory = categoryPage('<script>alert(1)</script>')
  assert.ok(!xssCategory.includes('<script>alert(1)</script>'))
  const validCategory = categoryPage('dzinējs')
  assert.ok(!validCategory.includes('category-search-empty'))
  assert.ok(categoryPage('balstiekārta').includes('Balstiekārtas'))
  assert.ok(STATIC_PAGES.about.includes('PAR TRACKPARTS'))
  assert.ok(STATIC_PAGES.about.includes('Būvēts ceļam'))
  assert.ok(!STATIC_PAGES.account.includes('id="auth-form"'))
})

test('parseOptionalPrice handles 0 without falling back to Infinity', () => {
  assert.equal(parseOptionalPrice('0', Infinity), 0)
  assert.equal(parseOptionalPrice(0, Infinity), 0)
  assert.equal(parseOptionalPrice('', Infinity), Infinity)
  assert.equal(parseOptionalPrice('   ', 0), 0)
  assert.equal(parseOptionalPrice('250.5', Infinity), 250.5)
  assert.equal(parseOptionalPrice('-10', Infinity), Infinity)
  assert.equal(parseOptionalPrice('abc', 0), 0)
})

test('formatTelHref formats international and local numbers and rejects non-phone text', () => {
  assert.equal(formatTelHref('+371 2000 0000'), 'tel:+37120000000')
  assert.equal(formatTelHref('2000 1234'), 'tel:20001234')
  assert.equal(formatTelHref('20-00-12-34'), 'tel:20001234')
  assert.equal(formatTelHref('Sazinies e-pastā'), '')
  assert.equal(formatTelHref('123'), '')
  assert.equal(formatTelHref(''), '')
})

test('escapeIlikePattern escapes SQL wildcard characters', () => {
  assert.equal(escapeIlikePattern('%'), '\\%')
  assert.equal(escapeIlikePattern('dzinējs_1\\test%'), 'dzinējs\\_1\\\\test\\%')
})

test('withSubmitLock prevents concurrent re-entry and restores submit button state', async () => {
  const btn = { disabled: false, isConnected: true }
  const form = {
    dataset: {},
    querySelectorAll: () => [btn],
  }
  let calls = 0
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })

  const first = withSubmitLock(form, async () => {
    calls += 1
    assert.equal(btn.disabled, true)
    await gate
    return 'ok'
  })
  const second = withSubmitLock(form, async () => {
    calls += 1
    return 'duplicate'
  })

  assert.equal(await second, undefined)
  release()
  assert.equal(await first, 'ok')
  assert.equal(calls, 1)
  assert.equal(btn.disabled, false)
  assert.equal(form.dataset.submitting, undefined)

  await assert.rejects(
    withSubmitLock(form, async () => {
      assert.equal(btn.disabled, true)
      throw new Error('boom')
    }),
    /boom/,
  )
  assert.equal(btn.disabled, false)
  assert.equal(form.dataset.submitting, undefined)
})

test('trapFocus cycles Tab and Shift+Tab cleanly inside dialogs', () => {
  let focused = null
  const first = { hidden: false, focus: () => (focused = first) }
  const last = { hidden: false, focus: () => (focused = last) }
  const doc = { activeElement: last }
  const container = {
    ownerDocument: doc,
    contains: (el) => el === first || el === last,
    querySelectorAll: () => [first, last],
  }
  let prevented = false
  trapFocus(container, { key: 'Tab', shiftKey: false, preventDefault: () => (prevented = true) })
  assert.equal(prevented, true)
  assert.equal(focused, first)

  doc.activeElement = first
  prevented = false
  trapFocus(container, { key: 'Tab', shiftKey: true, preventDefault: () => (prevented = true) })
  assert.equal(prevented, true)
  assert.equal(focused, last)
})

test('index.html CSP disallows inline scripts and allows Supabase + fonts', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes("script-src 'self'"))
  assert.ok(!html.includes("script-src 'self' 'unsafe-inline'"))
  assert.ok(html.includes('https://*.supabase.co'))
})
