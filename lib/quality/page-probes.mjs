import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

// In-page quality probes used by browser-qa. Each returns plain data; browser-qa decides what fails.
const require = createRequire(import.meta.url);
let axeSource;
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
export const BUDGETS = {clsFail: 0.25, clsWarn: 0.1, pageBytesFail: 5_000_000, pageBytesWarn: 2_000_000};

/** Observe layout shift and LCP from the very first paint. Call before navigation. */
export const observePerformance = page => page.addInitScript(() => {
  window.__icm = {cls: 0, lcp: 0};
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__icm.cls += e.value; }).observe({type: 'layout-shift', buffered: true});
    new PerformanceObserver(l => { const e = l.getEntries().at(-1); if (e) window.__icm.lcp = e.startTime; }).observe({type: 'largest-contentful-paint', buffered: true});
  } catch { /* unsupported entry type: metrics stay 0 and are reported as unmeasured */ }
});

export const readPerformance = page => page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const bytes = [nav, ...performance.getEntriesByType('resource')].reduce((s, e) => s + (e?.encodedBodySize || 0), 0);
  return {cls: +(window.__icm?.cls ?? 0).toFixed(4), lcpMs: Math.round(window.__icm?.lcp ?? 0), pageBytes: bytes};
});

/** Run axe-core with explicit WCAG tags. Evaluated via CDP so a strict page CSP cannot block it. */
export async function runAxe(page) {
  axeSource ??= await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
  await page.evaluate(axeSource);
  const tags = AXE_TAGS;
  return page.evaluate(async tags => {
    const r = await window.axe.run(document, {runOnly: {type: 'tag', values: tags}, resultTypes: ['violations']});
    return r.violations.map(v => ({id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') ?? ''}));
  }, tags);
}

/**
 * Tab through the page like a keyboard user. Reports controls that never receive focus and controls whose
 * appearance does not change when focused (WCAG 2.4.7). Radios are skipped: only one per group is a tab stop.
 */
export async function keyboardAudit(page) {
  const total = await page.evaluate(() => {
    const sel = 'a[href],button,input:not([type=hidden]):not([type=radio]),select,textarea,summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
    const visible = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.disabled && !e.closest('[inert],[hidden]'); };
    const look = e => { const s = getComputedStyle(e); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.backgroundColor, s.color, s.borderTopColor, s.textDecorationLine].join('|'); };
    const els = [...document.querySelectorAll(sel)].filter(visible);
    window.__icmKb = {els, look, before: new Map(els.map(e => [e, look(e)]))};
    return els.length;
  });
  const reached = new Set(), weak = [];
  for (let i = 0; i < Math.min(total + 2, 150); i++) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate(() => {
      const k = window.__icmKb, e = document.activeElement, idx = k.els.indexOf(e);
      if (idx < 0) return null;
      return {idx, changed: k.look(e) !== k.before.get(e), label: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 50)};
    });
    if (!hit || reached.has(hit.idx)) continue;
    reached.add(hit.idx);
    if (!hit.changed) weak.push(hit.label);
  }
  return {controls: total, reached: reached.size, unreachable: total - reached.size, noFocusIndicator: weak};
}
