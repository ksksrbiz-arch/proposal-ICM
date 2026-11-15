// Regression tests for the Foundation gates and the added quality gates. All fixtures are fictional.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fixture, server} from './fixture.mjs';
import {json, putJson} from '../lib/files.mjs';
import {validateGate, collectGates, GateError, CODES, similarity} from '../lib/gates.mjs';
import {lintPage, factCorpus} from '../lib/quality/static.mjs';
import {browserQa, launchOptions} from '../lib/browser-qa.mjs';
import {run} from '../bin/icm.mjs';

const corpus = factCorpus({facts: [
  {publicUse: true, statement: 'The workshop phone number is +1 202 555 0123 and email is hello@example.test.', qualification: ''},
  {publicUse: true, statement: 'Repairs start at $85 per visit. Established in 1998.', qualification: ''},
  {publicUse: false, statement: 'Private note: award-winning claim is unverified $9999.', qualification: ''}
]});
const page = body => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>T</title></head><body><main><h1>T</h1>${body}</main></body></html>`;
const codes = r => r.fail.map(f => f.code);

test('every catalog code names an owner, meaning and repair', () => {
  for (const [code, e] of Object.entries(CODES)) assert.ok(e.stage && e.meaning && e.fix && e.code === code, code);
});
test('every code used in gate source exists in the catalog', async () => {
  const used = new Set();
  for (const dir of ['lib/gates', 'lib/quality']) for (const f of await readdir(resolve(dir))) {
    for (const m of (await readFile(resolve(dir, f), 'utf8')).matchAll(/'((?:brief|research|design|build|qa|review|publish|register|gate|batch)\.[a-z0-9-]+)'/g)) used.add(m[1]);
  }
  for (const code of used) assert.ok(CODES[code], `Unknown code in source: ${code}`);
});

test('static lint blocks unsourced prices, phones, emails, ratings, years and superlatives', () => {
  assert.deepEqual(codes(lintPage('ok.html', page('<p>Repairs start at $85. Call +1 (202) 555-0123 or hello@example.test. Established in 1998.</p>'), corpus)), []);
  for (const bad of ['<p>Only $49 today</p>', '<p>Call 503-555-0188</p>', '<a href="tel:+15035550188">call</a>', '<p>write sales@other.test</p>', '<p>Rated 4.9 stars</p>', '<p>Over 500 reviews</p>', '<p>Since 1975 we serve</p>', '<p>We are award-winning</p>', '<p>Satisfaction guaranteed</p>']) {
    assert.ok(codes(lintPage('bad.html', page(bad), corpus)).includes('build.claim-unsupported'), bad);
  }
  // A private (publicUse:false) fact must not authorize public copy.
  assert.ok(codes(lintPage('bad.html', page('<p>award-winning</p>'), corpus)).includes('build.claim-unsupported'));
  // Disclosure language is not a claim of being official.
  assert.deepEqual(codes(lintPage('ok.html', page('<p>This is not the official website.</p>'), corpus)), []);
});

test('static lint blocks placeholders, structure and link defects but only warns on style', () => {
  const r = lintPage('x.html', '<html><head></head><body><p>Lorem ipsum</p><img src="a.png"><a href="#">x</a><a href="tel:12">t</a><a href="https://e.test" target="_blank">e</a><img src="http://e.test/a.png" alt=""></body></html>', corpus);
  const got = new Set(codes(r));
  for (const c of ['build.placeholder-content', 'build.html-structure', 'build.link-unsafe']) assert.ok(got.has(c), c);
  const soft = lintPage('s.html', page('<h3>Skipped</h3><p>Unlock seamless, world-class service.</p>'), corpus);
  assert.deepEqual(codes(soft), []);
  assert.ok(soft.warn.length >= 2);
});

test('build gate fails on placeholder copy and reports the stage code', async () => {
  const root = await fixture(), file = resolve(root, 'site/dist/index.html');
  await writeFile(file, (await readFile(file, 'utf8')).replace('This fictional workshop', 'TODO write this fictional workshop'));
  await assert.rejects(validateGate(root, 'build'), e => e instanceof GateError && e.stage === 'build' && e.issues.some(i => i.code === 'build.placeholder-content'));
});

test('gates report every issue of a stage, not only the first', async () => {
  const root = await fixture(), r = await json(resolve(root, 'research.json'));
  r.identity.matched = false; r.facts[0].sourceIds = []; r.facts[0].status = 'VERIFY';
  await putJson(resolve(root, 'research.json'), r);
  await assert.rejects(validateGate(root, 'research'), e => {
    const got = e.issues.map(i => i.code);
    return e instanceof GateError && got.includes('research.identity-unresolved') && got.includes('research.fact-unsupported') && got.includes('research.fact-unqualified');
  });
});

test('collectGates shows pass, fail and blocked stages without throwing', async () => {
  const root = await fixture(), result = await collectGates(root);
  assert.equal(result.ok, false);
  assert.deepEqual(result.stages.map(s => s.status), ['pass', 'pass', 'pass', 'pass', 'fail', 'blocked', 'blocked', 'blocked']);
  assert.equal(result.stages[5].blockedBy, 'qa');
  assert.ok(result.warnings.length > 0);
});

test('CLI: gate all, explain and doctor are available; unknown codes are refused', async () => {
  const root = await fixture();
  assert.equal((await run(['gate', root, 'all'])).ok, false);
  assert.equal((await run(['explain', 'build.allowlist-mismatch'])).stage, 'build');
  await assert.rejects(run(['explain', 'nope.nope']), /Unknown code/);
  assert.ok(String(await run(['help'])).includes('doctor'));
});

test('near-duplicate layout signatures are measurably similar', () => {
  assert.ok(similarity('hero left photo right three card grid footer map', 'hero left photo right three card grid footer map section') > 0.8);
  assert.ok(similarity('menu board ledger with handwritten daily specials strip', 'timeline of restoration stages with before after slider') < 0.2);
});

test('browser launch options honor explicit executable path before channel', () => {
  assert.deepEqual(launchOptions({PLAYWRIGHT_EXECUTABLE_PATH: '/x/chrome', PLAYWRIGHT_CHANNEL: 'chrome'}), {executablePath: '/x/chrome'});
  assert.deepEqual(launchOptions({PLAYWRIGHT_CHANNEL: 'chrome'}), {channel: 'chrome'});
  assert.deepEqual(launchOptions({}), {});
});

test('browser QA blocks serious accessibility, keyboard and layout-shift defects', async t => {
  const root = await fixture(), file = resolve(root, 'site/dist/index.html');
  const html = await readFile(file, 'utf8');
  const hostile = '<style>a:focus,button:focus{outline:none;box-shadow:none}.low{color:#cfcfcf;background:#fff}</style><p class="low">Low contrast sentence for the contrast rule.</p>';
  await writeFile(file, html.replace('</head>', hostile + '</head>').replace('<button', '<button style="outline:none"'));
  const s = await server(root);
  t.after(s.close);
  let failure;
  try { await browserQa(root, s.base, 'local'); } catch (e) { failure = e; }
  assert.match(failure?.message ?? '', /browser checks failed/);
  const report = await json(resolve(root, 'evidence/technical-local.json'));
  const problems = report.failures.flatMap(f => f.problems ?? []);
  assert.ok(problems.some(p => /Accessibility \((serious|critical)\): color-contrast/.test(p)), problems.join('\n'));
  assert.ok(problems.some(p => /Keyboard: no visible focus indicator/.test(p)), problems.join('\n'));
  const ok = report.cases.find(c => c.path === '/services' && c.width === 1440);
  assert.equal(ok.passed, true);
  assert.ok(ok.metrics && 'cls' in ok.metrics && 'pageBytes' in ok.metrics && ok.metrics.keyboard.unreachable === 0);
});
