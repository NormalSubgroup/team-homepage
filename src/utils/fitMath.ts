/*
  KaTeX display-math auto-fit utility
  - Scales inner `.katex` when its natural width exceeds its container
  - Avoids page horizontal scroll by clipping overflow on the container (CSS)
  - Observes size and DOM changes to keep formulas fitted on rotation/resizes
*/

type FitOptions = {
  selector?: string
  minScale?: number
  maxScale?: number
}

function findInner(box: Element | null): HTMLElement | null {
  if (!box) return null
  // KaTeX display mode markup: <span class="katex-display"><span class="katex">…</span></span>
  const inner = (box as HTMLElement).querySelector(':scope > .katex') as HTMLElement | null
  return inner || null
}

function fitOne(el: Element, opts: Required<FitOptions>) {
  const container = el as HTMLElement
  const inner = findInner(container)
  if (!inner) return

  // Temporarily reset transform to measure the natural width
  const prev = inner.style.transform
  inner.style.transform = 'none'

  // Slight safety margins to avoid touching edges
  const containerWidth = Math.max(0, container.clientWidth - 2)
  const naturalWidth = Math.max(inner.scrollWidth, inner.clientWidth)

  if (containerWidth <= 0 || naturalWidth <= 0) {
    inner.style.transform = prev
    return
  }

  const s = Math.min(opts.maxScale, containerWidth / naturalWidth)

  if (s < 1) {
    // Scale around center; `.katex-display` is centered by default
    inner.style.transform = `scale(${s})`
  } else {
    inner.style.transform = ''
  }
}

export function initKatexDisplayAutoFit(options: FitOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}

  const opts: Required<FitOptions> = {
    selector: options.selector || '.katex-display',
    minScale: options.minScale ?? 0.6,
    maxScale: options.maxScale ?? 1,
  }

  const runAll = () => {
    document.querySelectorAll(opts.selector).forEach((el) => fitOne(el, opts))
  }

  // On first paint and when fonts settle
  const onReady = () => runAll()
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    requestAnimationFrame(onReady)
  } else {
    document.addEventListener('DOMContentLoaded', onReady, { once: true })
  }
  window.addEventListener('load', runAll)
  window.addEventListener('resize', runAll)

  // Observe container size changes
  const ro = new ResizeObserver((entries) => {
    for (const { target } of entries) fitOne(target, opts)
  })
  const observeAll = () => {
    document.querySelectorAll(opts.selector).forEach((el) => ro.observe(el))
  }
  observeAll()

  // Observe DOM insertions where new display math may appear
  const mo = new MutationObserver((muts) => {
    let touched = false
    for (const m of muts) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          if (node.matches && node.matches(opts.selector)) {
            fitOne(node, opts)
            ro.observe(node)
            touched = true
          } else if ((node as Element).querySelector && (node as Element).querySelector(opts.selector)) {
            touched = true
          }
        })
      }
    }
    if (touched) { runAll(); observeAll() }
  })
  mo.observe(document.documentElement, { childList: true, subtree: true })

  // Return a disposer if the app ever needs to unhook
  return () => {
    try { ro.disconnect() } catch {}
    try { mo.disconnect() } catch {}
    window.removeEventListener('load', runAll)
    window.removeEventListener('resize', runAll)
  }
}

export default initKatexDisplayAutoFit
