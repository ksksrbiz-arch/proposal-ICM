import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Static checks over allowlisted public HTML. No browser, no network. Findings are
// {code, message} failures or {kind, message} warnings. A lint cannot prove copy is good;
// it blocks the specific failures that cost real prospects trust: unsourced claims, placeholders, broken links.

const PLACEHOLDER = /lorem ipsum|dolor sit amet|\bTODO\b|\bTBD\b|\bFIXME\b|\bXXX\b|your (?:text|business name|content|company) here|\[(?:insert|placeholder)[^\]]*\]|\{\{[^}]+\}\}|click here to edit|coming soon|under construction/i;
const SUPERLATIVE = /\b(guarantee[ds]?|#1|number one|best in (?:town|class|the)|award[- ]winning|official (?:web)?site|lowest price|licensed and insured|fully certified|voted best)\b/gi;
const CLICHE = /\b(unlock|elevate your|seamless(?:ly)?|cutting-edge|world-class|state-of-the-art|in today's fast-paced|game-changer|one-stop(?: shop)?|take (?:it|your \w+) to the next level|passion for excellence)\b/gi;
const RATING = /\b\d(?:\.\d)?\s*(?:\/\s*5|-?\s*stars?)\b|\b\d[\d,]*\+?\s+(?:five-star\s+|5-star\s+)?(?:customer\s+)?reviews?\b/gi;
const SINCE = /\b(?:since|est\.?|established|founded(?:\s+in)?)\s+((?:18|19|20)\d\d)\b/gi;
const MONEY = /\$\s?\d[\d,]*(?:\.\d{1,2})?/g;
const PHONE = /(?<!\d)(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}(?!\d)/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

const strip = html => html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'");
export const visibleText = html => decode(strip(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find(v => v !== undefined);
const hasAttr = (tag, name) => new RegExp(`\\s${name}(?=[\\s=>/])`, 'i').test(tag);

/** Public-use research facts (statement + qualification), normalised for value matching. */
export function factCorpus(research) {
  const text = research.facts.filter(f => f.publicUse).map(f => `${f.statement} ${f.qualification ?? ''}`).join(' \n ');
  return {lower: text.toLowerCase(), compact: text.toLowerCase().replace(/[\s,]/g, ''), digits: text.replace(/\D/g, '')};
}

export function lintPage(file, html, corpus) {
  const fail = [], warn = [];
  const bad = (code, message) => fail.push({code, message: `${file}: ${message}`});
  const note = message => warn.push({kind: 'copy-or-markup-review', message: `${file}: ${message}`});
  const text = visibleText(html), bodyAttrs = html.match(/<(?:a|img|link|source)\b[^>]*>/gi) ?? [];
  const ph = text.match(PLACEHOLDER) ?? html.match(/<title>[^<]*(?:lorem|todo)[^<]*<\/title>/i);
  if (ph) bad('build.placeholder-content', `Placeholder or unfinished text: "${(Array.isArray(ph) ? ph[0] : ph).slice(0, 40)}"`);

  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? '';
  if (!/\slang\s*=\s*["']?[a-z]{2}/i.test(htmlTag)) bad('build.html-structure', 'Missing <html lang>');
  if (!/<title>[^<]*\S[^<]*<\/title>/i.test(html)) bad('build.html-structure', 'Missing or empty <title>');
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) bad('build.html-structure', 'Missing viewport meta');
  if (!/<meta\b[^>]*name=["']description["']/i.test(html)) note('No meta description');
  if ((html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '').length > 70) note('Title longer than 70 characters');

  for (const img of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!hasAttr(img, 'alt')) bad('build.html-structure', `Image without alt attribute: ${(attr(img, 'src') ?? '').slice(0, 60)}`);
    if (!(hasAttr(img, 'width') && hasAttr(img, 'height')) && !/aspect-ratio/i.test(attr(img, 'style') ?? '')) note(`Image without width/height (layout shift risk): ${(attr(img, 'src') ?? '').slice(0, 60)}`);
  }
  for (const a of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = (attr(a, 'href') ?? '').trim();
    if (hasAttr(a, 'href') && (href === '' || href === '#' || /^javascript:/i.test(href))) bad('build.link-unsafe', `Dead link target "${href}"`);
    if (/^tel:/i.test(href) && !/^tel:\+?[\d\-().\s%]{7,}$/i.test(href)) bad('build.link-unsafe', `Malformed tel link: ${href}`);
    if (/^mailto:/i.test(href) && !/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/i.test(href)) bad('build.link-unsafe', `Malformed mailto link: ${href}`);
    if (/^_blank$/i.test(attr(a, 'target') ?? '') && !/noopener/i.test(attr(a, 'rel') ?? '')) bad('build.link-unsafe', `target=_blank without rel=noopener: ${href.slice(0, 60)}`);
  }
  for (const tag of bodyAttrs) for (const n of ['src', 'href']) {
    const v = attr(tag, n) ?? '';
    if (/^http:\/\//i.test(v) && /^<(?:img|link|source)/i.test(tag)) bad('build.mixed-content', `Insecure subresource: ${v.slice(0, 80)}`);
  }
  const third = new Set((html.match(/<script\b[^>]*\ssrc=["']https?:\/\/([^/"']+)/gi) ?? []).map(s => s.match(/https?:\/\/([^/"']+)/i)[1]));
  if (third.size) note(`Third-party scripts (${[...third].join(', ')}): confirm each is necessary and disclosed`);
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map(m => +m[1]);
  levels.forEach((l, i) => { if (i && l > levels[i - 1] + 1) note(`Heading level skips from h${levels[i - 1]} to h${l}`); });
  for (const m of text.matchAll(CLICHE)) note(`Marketing cliché "${m[0]}": say the specific thing instead`);

  // Claims: every concrete value on a page must appear in a public research fact.
  const claim = (what, value) => bad('build.claim-unsupported', `${what} "${value}" has no matching public research fact`);
  const hrefs = (html.match(/(?:tel|mailto):[^"'<>\s]+/gi) ?? []).map(decodeURIComponent).join(' ');
  const scan = `${text} ${hrefs}`;
  for (const m of new Set(scan.match(MONEY) ?? [])) if (!corpus.compact.includes(m.toLowerCase().replace(/[\s,]/g, ''))) claim('Price', m);
  for (const m of new Set(scan.match(PHONE) ?? [])) { const d = m.replace(/\D/g, '').slice(-10); if (!corpus.digits.includes(d)) claim('Phone number', m); }
  for (const m of new Set(scan.match(EMAIL) ?? [])) if (!corpus.lower.includes(m.toLowerCase())) claim('Email', m);
  for (const m of new Set(text.match(RATING) ?? [])) if (!corpus.lower.includes(m.toLowerCase())) claim('Rating/review figure', m);
  for (const m of text.matchAll(SINCE)) if (!corpus.lower.includes(m[1])) claim('Founding year', m[0]);
  for (const m of text.matchAll(SUPERLATIVE)) {
    const before = text.slice(Math.max(0, m.index - 30), m.index);
    if (/\b(not|isn'?t|unofficial|independent|never)\b/i.test(before)) continue;
    if (!corpus.lower.includes(m[0].toLowerCase())) claim('Unverifiable claim', m[0]);
  }
  return {fail, warn};
}

export async function lintSite(out, allowlist, research) {
  const corpus = factCorpus(research), fail = [], warn = [];
  for (const f of allowlist.filter(x => /\.html?$/i.test(x))) {
    const r = lintPage(f, await readFile(resolve(out, f), 'utf8'), corpus);
    fail.push(...r.fail); warn.push(...r.warn);
  }
  return {fail, warn};
}
