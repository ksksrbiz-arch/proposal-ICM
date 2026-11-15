import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {resolve, relative, sep} from 'node:path';
import {packet, fingerprint, validateGate, VIEWPORTS} from './gates.mjs';
import {putJson, json, reference, hash, webUrl} from './files.mjs';
import {observePerformance, readPerformance, runAxe, keyboardAudit, BUDGETS} from './quality/page-probes.mjs';

/** PLAYWRIGHT_EXECUTABLE_PATH wins over PLAYWRIGHT_CHANNEL; default is Playwright's own Chromium. */
export function launchOptions(env = process.env) {
  if (env.PLAYWRIGHT_EXECUTABLE_PATH) return {executablePath: env.PLAYWRIGHT_EXECUTABLE_PATH};
  if (env.PLAYWRIGHT_CHANNEL) return {channel: env.PLAYWRIGHT_CHANNEL};
  return {};
}

const PROPOSAL_DISCLOSURE = /independent.{0,30}(proposal|concept)|website proposal|proposed (website|redesign)/i;
const BLOCKING_IMPACT = new Set(['critical', 'serious']);

const domState = () => {
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id), main = document.querySelector('main');
  const small = [...document.querySelectorAll('a,button,input,select,textarea')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && (r.width < 24 || r.height < 24); });
  return {
    title: document.title, h1: document.querySelectorAll('h1').length, mainText: main?.innerText ?? '', text: document.body.innerText,
    robots: document.querySelector('meta[name="robots"]')?.content ?? '', overflow: document.documentElement.scrollWidth > innerWidth + 1,
    duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
    brokenImages: [...document.images].filter(im => !!im.getAttribute('src') && !im.naturalWidth).map(im => im.src),
    links: [...document.querySelectorAll('a[href]')].map(a => ({href: a.href, text: a.innerText.trim()})),
    actions: small.map(e => (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 80))
  };
};

async function scanRoute({page, route, base, viewport, index, out, root, seen}) {
  const errors = [], resourceErrors = [];
  const onError = e => errors.push(e.message);
  const onResponse = r => { if (r.url().startsWith(base.origin) && r.status() >= 400) resourceErrors.push({url: r.url(), status: r.status()}); };
  const onFailed = r => { if (r.url().startsWith(base.origin)) resourceErrors.push({url: r.url(), error: r.failure()?.errorText}); };
  page.on('pageerror', onError); page.on('response', onResponse); page.on('requestfailed', onFailed);
  try {
    const response = await page.goto(new URL(route.path, base).href, {waitUntil: 'networkidle', timeout: 30000});
    const perf = await readPerformance(page);
    await page.evaluate(async () => { await document.fonts.ready; for (const im of document.images) im.loading = 'eager'; await Promise.all([...document.images].map(im => im.decode().catch(() => {}))); });
    const state = await page.evaluate(domState);
    const problems = [], warnings = [];

    if (response?.status() !== 200) problems.push('HTTP ' + response?.status());
    if (state.h1 !== 1) problems.push('Expected one H1');
    if (!state.title) problems.push('Missing title');
    if (!/noindex/i.test(state.robots)) problems.push('Missing noindex meta');
    if (!PROPOSAL_DISCLOSURE.test(state.text)) problems.push('Missing independent proposal disclosure');
    if (state.overflow) problems.push('Horizontal overflow');
    if (state.duplicateIds.length) problems.push('Duplicate IDs');
    if (state.brokenImages.length) problems.push('Broken images');
    if (errors.length) problems.push('JavaScript errors');
    if (resourceErrors.length) problems.push('Failed same-origin resources');
    if (!state.mainText.trim()) problems.push('Missing semantic main content');
    if (route.primaryAction.kind !== 'local' && !state.links.some(l => l.href === new URL(route.primaryAction.target, new URL(route.path, base)).href)) problems.push('Planned primary action absent');

    // Accessibility (axe-core, WCAG 2.0-2.2 A/AA). Critical/serious block; the rest are review warnings.
    const a11y = await runAxe(page);
    for (const v of a11y) {
      if (BLOCKING_IMPACT.has(v.impact)) problems.push(`Accessibility (${v.impact}): ${v.id} on ${v.nodes} element(s), e.g. ${v.sample}`);
      else warnings.push({kind: 'axe-review', rule: v.id, impact: v.impact, nodes: v.nodes});
    }
    // Keyboard: every visible control reachable, with a visible focus change.
    const keyboard = await keyboardAudit(page);
    if (keyboard.unreachable > 0) problems.push(`Keyboard: ${keyboard.unreachable} visible control(s) never received focus`);
    if (keyboard.noFocusIndicator.length) problems.push(`Keyboard: no visible focus indicator on ${keyboard.noFocusIndicator.slice(0, 3).join(', ')}`);
    // Stability and weight.
    if (perf.cls > BUDGETS.clsFail) problems.push(`Layout shift ${perf.cls} exceeds ${BUDGETS.clsFail}`);
    else if (perf.cls > BUDGETS.clsWarn) warnings.push({kind: 'layout-shift-review', cls: perf.cls});
    if (perf.pageBytes > BUDGETS.pageBytesFail) problems.push(`Page weight ${perf.pageBytes} bytes exceeds ${BUDGETS.pageBytesFail}`);
    else if (perf.pageBytes > BUDGETS.pageBytesWarn) warnings.push({kind: 'page-weight-review', bytes: perf.pageBytes});
    if (state.actions.length) warnings.push({kind: 'targets-under-24px-review', controls: state.actions});

    if (viewport.width === 1440) {
      const mainHash = hash(state.mainText.replace(/\s+/g, ' ').trim());
      if (seen.contents.has(mainHash)) problems.push('Duplicate main content with ' + seen.contents.get(mainHash));
      seen.contents.set(mainHash, route.path);
      if (seen.titles.has(state.title)) problems.push('Duplicate page title with ' + seen.titles.get(state.title));
      seen.titles.set(state.title, route.path);
      for (const l of state.links) {
        try { const u = new URL(l.href); if (u.origin === base.origin && ['http:', 'https:'].includes(u.protocol)) seen.links.set(u.href, route.path); }
        catch { problems.push('Invalid link'); }
      }
    }
    const shot = resolve(out, `${String(index).padStart(3, '0')}-${viewport.width}x${viewport.height}.png`);
    await page.screenshot({path: shot, fullPage: true});
    const screenshot = await reference(root, relative(root, shot).split(sep).join('/'));
    return {kase: {path: route.path, ...viewport, passed: problems.length === 0, screenshot, problems, errors, resourceErrors, metrics: {...perf, axeViolations: a11y.length, keyboard}}, warnings};
  } finally {
    page.off('pageerror', onError); page.off('response', onResponse); page.off('requestfailed', onFailed);
  }
}

async function checkInternalLinks(browser, links, failures) {
  const context = await browser.newContext(), page = await context.newPage();
  for (const [url, from] of links) {
    try {
      const r = await context.request.get(url, {timeout: 20000});
      if (r.status() !== 200) throw Error('HTTP ' + r.status());
      const u = new URL(url);
      if (u.hash) {
        const html = await r.text();
        const exists = await page.evaluate(({html, id}) => !!new DOMParser().parseFromString(html, 'text/html').getElementById(id), {html, id: decodeURIComponent(u.hash.slice(1))});
        if (!exists) throw Error('Missing fragment');
      }
    } catch (e) { failures.push({from, url, error: e.message}); }
  }
  await context.close();
}

export async function browserQa(root, baseUrl, mode) {
  if (!['local', 'hosted'].includes(mode) || !webUrl(baseUrl)) throw Error('Expected HTTP(S) base URL and local|hosted');
  await validateGate(root, 'build');
  root = resolve(root);
  const base = new URL(baseUrl);
  if (base.pathname !== '/' || base.search || base.hash) throw Error('QA base must be the origin URL');
  const plan = await packet(root, 'routes'), fp = await fingerprint(root), out = resolve(root, 'evidence/screenshots', mode);
  await mkdir(out, {recursive: true});
  const browser = await chromium.launch({headless: true, ...launchOptions()});
  const cases = [], failures = [], warnings = [], seen = {links: new Map(), contents: new Map(), titles: new Map()};
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({viewport, reducedMotion: 'reduce', hasTouch: viewport.width <= 768});
      const page = await context.newPage();
      await observePerformance(page);
      for (let i = 0; i < plan.pages.length; i++) {
        const route = plan.pages[i];
        try {
          const r = await scanRoute({page, route, base, viewport, index: i, out, root, seen});
          cases.push(r.kase);
          if (!r.kase.passed) failures.push(r.kase);
          for (const w of r.warnings) warnings.push({path: route.path, viewport, ...w});
        } catch (e) { failures.push({path: route.path, ...viewport, error: e.message}); }
      }
      await context.close();
    }
    await checkInternalLinks(browser, seen.links, failures);
  } finally { await browser.close(); }
  const report = {schemaVersion: 1, checkedAt: new Date().toISOString(), fingerprint: fp, baseUrl: base.href, mode, viewportMatrix: VIEWPORTS, cases, warnings, checkedInternalLinks: seen.links.size, failures};
  const path = `evidence/technical-${mode}.json`;
  await putJson(resolve(root, path), report);
  const file = mode === 'local' ? 'qa.json' : 'publication.json', record = await json(resolve(root, file));
  if (mode === 'local') { record.fingerprint = fp; record.technical = await reference(root, path); } else record.hostedQa = await reference(root, path);
  await putJson(resolve(root, file), record);
  if (failures.length) throw Error(`${failures.length} browser checks failed; see ${path}`);
  return {mode, cases: cases.length, warnings: warnings.length, report: path};
}
