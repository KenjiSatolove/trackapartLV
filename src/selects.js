// Custom motorsport dropdown enhancer — upgrades every native <select> into
// a sleek floating popover on desktop and a thumb-friendly bottom sheet on mobile,
// while keeping the underlying <select> synced for FormData, listeners, and i18n.

let activeState = null // { select, trigger, wrapper }
let globalListenersBound = false

const CHEVRON_SVG = `<svg class="tp-select-chevron-svg" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.25 5.25 7 9l3.75-3.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const CHECK_SVG = `<svg class="tp-select-check-svg" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.75 7.25 5.75 10.25 11.25 3.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function ensureOverlay() {
  if (typeof document === 'undefined') return null
  let popover = document.querySelector('#tp-select-popover')
  let backdrop = document.querySelector('#tp-select-backdrop')
  if (!backdrop) {
    backdrop = document.createElement('div')
    backdrop.id = 'tp-select-backdrop'
    backdrop.className = 'tp-select-backdrop'
    backdrop.addEventListener('click', () => closeOpenSelect({ restoreFocus: true }))
    document.body.appendChild(backdrop)
  }
  if (!popover) {
    popover = document.createElement('div')
    popover.id = 'tp-select-popover'
    popover.className = 'tp-select-popover'
    popover.setAttribute('aria-hidden', 'true')
    popover.innerHTML = `<div class="tp-select-sheet-head">
        <span class="tp-select-sheet-handle" aria-hidden="true"></span>
        <div class="tp-select-sheet-row">
          <span class="tp-select-sheet-title" id="tp-select-sheet-title"></span>
          <button type="button" class="tp-select-sheet-close" id="tp-select-sheet-close" aria-label="Close">×</button>
        </div>
      </div>
      <div class="tp-select-list" id="tp-select-list" role="listbox"></div>`
    document.body.appendChild(popover)
    popover.querySelector('#tp-select-sheet-close')?.addEventListener('click', () => {
      closeOpenSelect({ restoreFocus: true })
    })
  }
  if (!globalListenersBound) {
    globalListenersBound = true
    document.addEventListener('pointerdown', (event) => {
      if (!activeState) return
      const target = event.target
      if (popover.contains(target) || activeState.wrapper.contains(target)) return
      closeOpenSelect()
    })
    window.addEventListener(
      'scroll',
      (event) => {
        if (!activeState) return
        if (popover.classList.contains('is-sheet')) return
        if (event.target instanceof Node && popover.contains(event.target)) return
        closeOpenSelect()
      },
      true,
    )
    window.addEventListener('resize', () => {
      if (activeState) closeOpenSelect()
    })
  }
  return { popover, backdrop }
}

function getSelectTitle(select) {
  const aria = select.getAttribute('aria-label')
  if (aria) return aria.trim()
  const label = select.closest('label')
  if (!label) return ''
  const parts = []
  for (const node of label.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.nodeValue.trim()
      if (txt) parts.push(txt)
    }
  }
  return parts.join(' ').trim()
}

export function isSelectOpen() {
  return Boolean(activeState)
}

export function closeOpenSelect({ restoreFocus = false } = {}) {
  if (typeof document === 'undefined' || !activeState) return false
  const prev = activeState
  activeState = null
  prev.wrapper.classList.remove('is-open')
  prev.trigger.setAttribute('aria-expanded', 'false')
  const popover = document.querySelector('#tp-select-popover')
  const backdrop = document.querySelector('#tp-select-backdrop')
  if (popover) {
    popover.classList.remove('is-open', 'is-above', 'is-sheet')
    popover.setAttribute('aria-hidden', 'true')
  }
  backdrop?.classList.remove('is-open')
  if (restoreFocus && prev.trigger.isConnected) {
    prev.trigger.focus()
  }
  return true
}

function selectOption(select, value) {
  const changed = select.value !== value
  select.value = value
  syncSelect(select)
  closeOpenSelect({ restoreFocus: true })
  if (changed) {
    select.dispatchEvent(new Event('input', { bubbles: true }))
    select.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

function positionPopover(popover, backdrop, trigger) {
  const isMobileSheet = window.innerWidth <= 640
  const list = popover.querySelector('#tp-select-list')
  if (isMobileSheet) {
    popover.classList.add('is-sheet')
    popover.classList.remove('is-above')
    popover.style.top = ''
    popover.style.bottom = ''
    popover.style.left = ''
    popover.style.minWidth = ''
    popover.style.maxWidth = ''
    if (list) list.style.maxHeight = ''
    backdrop.classList.add('is-open')
    return
  }

  popover.classList.remove('is-sheet')
  backdrop.classList.remove('is-open')

  const rect = trigger.getBoundingClientRect()
  const margin = 12
  const minW = Math.max(rect.width, 180)
  const maxW = Math.min(360, window.innerWidth - margin * 2)
  popover.style.minWidth = `${Math.round(Math.min(minW, maxW))}px`
  popover.style.maxWidth = `${Math.round(maxW)}px`
  popover.style.top = '0px'
  popover.style.bottom = ''
  popover.style.left = '0px'

  // Measure height with temporary visibility
  const popWidth = Math.min(Math.max(popover.offsetWidth, minW), maxW)
  let left = rect.left
  if (left + popWidth > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - margin - popWidth)
  }
  if (left < margin) left = margin
  popover.style.left = `${Math.round(left)}px`

  const spaceBelow = window.innerHeight - rect.bottom - margin
  const spaceAbove = rect.top - margin
  const naturalHeight = popover.offsetHeight || 220

  if (spaceBelow < Math.min(240, naturalHeight) && spaceAbove > spaceBelow) {
    popover.classList.add('is-above')
    popover.style.top = ''
    popover.style.bottom = `${Math.round(window.innerHeight - rect.top + 6)}px`
    if (list) list.style.maxHeight = `${Math.max(120, Math.min(280, spaceAbove - 18))}px`
  } else {
    popover.classList.remove('is-above')
    popover.style.bottom = ''
    popover.style.top = `${Math.round(rect.bottom + 6)}px`
    if (list) list.style.maxHeight = `${Math.max(120, Math.min(280, spaceBelow - 18))}px`
  }
}

function openSelect(select, wrapper, trigger, { focusSelected = true } = {}) {
  if (select.disabled) return
  if (activeState?.select === select) {
    closeOpenSelect({ restoreFocus: true })
    return
  }
  closeOpenSelect()

  const overlay = ensureOverlay()
  if (!overlay) return
  const { popover, backdrop } = overlay
  const list = popover.querySelector('#tp-select-list')
  const titleEl = popover.querySelector('#tp-select-sheet-title')
  if (!list) return

  const fieldTitle = getSelectTitle(select) || 'Select'
  if (titleEl) titleEl.textContent = fieldTitle
  list.setAttribute('aria-label', fieldTitle)
  list.innerHTML = ''

  const options = [...select.options]
  let selectedBtn = null

  options.forEach((opt, idx) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'tp-select-option'
    btn.setAttribute('role', 'option')
    btn.dataset.value = opt.value
    btn.dataset.index = String(idx)
    const isSelected = idx === select.selectedIndex
    btn.setAttribute('aria-selected', String(isSelected))
    if (isSelected) {
      btn.classList.add('is-selected')
      selectedBtn = btn
    }
    if (opt.disabled) btn.disabled = true

    const textSpan = document.createElement('span')
    textSpan.className = 'tp-select-option-text'
    textSpan.textContent = opt.textContent.trim()
    btn.appendChild(textSpan)

    if (isSelected) {
      const check = document.createElement('span')
      check.className = 'tp-select-option-check'
      check.innerHTML = CHECK_SVG
      btn.appendChild(check)
    }

    btn.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      selectOption(select, opt.value)
    })
    list.appendChild(btn)
  })

  activeState = { select, trigger, wrapper }
  wrapper.classList.add('is-open')
  trigger.setAttribute('aria-expanded', 'true')
  popover.setAttribute('aria-hidden', 'false')

  positionPopover(popover, backdrop, trigger)
  popover.classList.add('is-open')

  // Keyboard navigation inside listbox
  let typeBuffer = ''
  let typeTimer = null
  const onListKeydown = (event) => {
    const items = [...list.querySelectorAll('.tp-select-option:not(:disabled)')]
    if (!items.length) return
    const currentIdx = items.indexOf(document.activeElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = items[(currentIdx + 1) % items.length]
      next?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const prev = items[(currentIdx - 1 + items.length) % items.length]
      prev?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      items[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      items[items.length - 1]?.focus()
    } else if (event.key === 'Tab') {
      closeOpenSelect()
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeBuffer += event.key.toLowerCase()
      clearTimeout(typeTimer)
      typeTimer = setTimeout(() => {
        typeBuffer = ''
      }, 550)
      const match = items.find((item) => item.textContent.trim().toLowerCase().startsWith(typeBuffer))
      match?.focus()
    }
  }
  list.onkeydown = onListKeydown

  if (focusSelected) {
    requestAnimationFrame(() => {
      const target = selectedBtn || list.querySelector('.tp-select-option:not(:disabled)')
      if (target) {
        target.scrollIntoView({ block: 'nearest' })
        target.focus({ preventScroll: true })
      }
    })
  }
}

export function syncSelect(select) {
  if (typeof document === 'undefined' || !select) return
  const wrapper = select.closest('.tp-select')
  if (!wrapper) return
  const trigger = wrapper.querySelector('.tp-select-trigger')
  const valueEl = wrapper.querySelector('.tp-select-value')
  if (!trigger || !valueEl) return

  const selectedOpt = select.options[select.selectedIndex] || select.options[0]
  valueEl.textContent = selectedOpt ? selectedOpt.textContent.trim() : ''

  const hasEmptyDefault = select.options[0]?.value === ''
  const isActiveFilter = hasEmptyDefault && select.value !== ''
  trigger.classList.toggle('has-active-filter', isActiveFilter)
  trigger.disabled = Boolean(select.disabled)

  const title = getSelectTitle(select)
  if (title) trigger.setAttribute('aria-label', `${title}: ${valueEl.textContent}`)

  // Carry over admin order status classes (status-pending, status-paid, etc.) onto wrapper
  const statusClass = [...select.classList].find((c) => c.startsWith('status-'))
  ;[...wrapper.classList].filter((c) => c.startsWith('status-')).forEach((c) => wrapper.classList.remove(c))
  if (statusClass) wrapper.classList.add(statusClass)
}

export function syncAllSelects(root = document) {
  if (typeof document === 'undefined' || !root) return
  root.querySelectorAll('select[data-tp-enhanced="1"]').forEach((select) => syncSelect(select))
}

export function enhanceSelects(root = document) {
  if (typeof document === 'undefined' || !root) return
  const selects = root.querySelectorAll('select:not([data-tp-enhanced="1"])')
  selects.forEach((select) => {
    if (select.multiple || select.size > 1) return
    select.dataset.tpEnhanced = '1'

    const wrapper = document.createElement('div')
    wrapper.className = 'tp-select'
    if (select.classList.contains('admin-select')) wrapper.classList.add('tp-select--compact')
    if (select.closest('.select-row, .extra-filters')) wrapper.classList.add('tp-select--filter')
    if (select.closest('.catalog-main-top')) wrapper.classList.add('tp-select--inline')
    if (select.closest('.admin-drawer-form, .admin-product-form')) wrapper.classList.add('tp-select--drawer')

    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'tp-select-trigger'
    trigger.setAttribute('role', 'combobox')
    trigger.setAttribute('aria-haspopup', 'listbox')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.innerHTML = `<span class="tp-select-value-wrap"><span class="tp-select-dot" aria-hidden="true"></span><span class="tp-select-value"></span></span><span class="tp-select-chevron" aria-hidden="true">${CHEVRON_SVG}</span>`

    select.parentNode.insertBefore(wrapper, select)
    wrapper.appendChild(select)
    wrapper.appendChild(trigger)

    select.classList.add('tp-native-select')
    select.tabIndex = -1
    select.setAttribute('aria-hidden', 'true')

    trigger.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      openSelect(select, wrapper, trigger)
    })

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        openSelect(select, wrapper, trigger)
      }
    })

    // Clicking the surrounding <label> text opens our custom dropdown cleanly
    const parentLabel = wrapper.closest('label')
    if (parentLabel && !parentLabel.dataset.tpLabelBound) {
      parentLabel.dataset.tpLabelBound = '1'
      parentLabel.addEventListener('click', (event) => {
        if (wrapper.contains(event.target)) return
        event.preventDefault()
        openSelect(select, wrapper, trigger)
      })
    }

    select.addEventListener('change', () => syncSelect(select))

    // Automatically re-sync whenever options are dynamically rebuilt or translated
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => syncSelect(select))
      observer.observe(select, { childList: true, subtree: true, characterData: true, attributes: true })
    }

    syncSelect(select)
  })
}
