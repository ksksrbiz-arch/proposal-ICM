import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv from 'ajv';
import {json, hash, files, safePath, evidence, within} from '../files.mjs';

export const STAGES = ['brief', 'research', 'design', 'build', 'qa', 'review', 'publish', 'register', 'learn'];
export const VIEWPORTS = [{width: 320, height: 800}, {width: 390, height: 844}, {width: 768, height: 1024}, {width: 1024, height: 768}, {width: 1440, height: 1000}, {width: 844, height: 390}];
export const kit = fileURLToPath(new URL('../../', import.meta.url));

const ajv = new Ajv({allErrors: true, strict: true});
const schema = await json(resolve(kit, 'schemas/artifacts.schema.json'));
const validators = new Map();
export const compileBatch = async () => ajv.compile(await json(resolve(kit, 'schemas/batch.schema.json')));
export const ajvErrors = (v) => ajv.errorsText(v.errors);

export const timestamp = s => typeof s === 'string' && Number.isFinite(Date.parse(s));

/** Load and schema-validate one private packet. Throws on missing/invalid files (reported as gate.unreadable). */
export async function packet(root, name) {
  const value = await json(resolve(root, name + '.json'));
  let v = validators.get(name);
  if (!v) { v = ajv.compile({$ref: `#/definitions/${name}`, definitions: schema.definitions}); validators.set(name, v); }
  if (!v(value)) throw Error(`${name}.json: ${ajv.errorsText(v.errors, {separator: '; '})}`);
  return value;
}

/** Hash of every input that can change reviewed bytes. Permissions are excluded on purpose. */
export async function fingerprint(root) {
  const h = [];
  for (const n of ['project', 'research', 'assets', 'design', 'routes', 'flows', 'implementation']) {
    if (n === 'project') {
      const {permissions, ...buildInputs} = await json(resolve(root, n + '.json'));
      h.push([n, hash(JSON.stringify(buildInputs))]);
    } else h.push([n, hash(await readFile(resolve(root, n + '.json')))]);
  }
  const p = await packet(root, 'project'), b = await packet(root, 'implementation');
  const out = await safePath(root, p.outputDir), source = await safePath(root, b.sourceDir);
  if (!within(root, source)) throw Error('Source escapes project');
  for (const f of await files(source, {omit: [out, resolve(source, 'node_modules'), resolve(source, '.git')]})) h.push(['source/' + f, hash(await readFile(await safePath(source, f)))]);
  for (const f of [...b.allowlist].sort()) h.push(['public/' + f, hash(await readFile(await safePath(out, f)))]);
  for (const f of b.flowTestFiles) h.push(['test/' + f, hash(await readFile(await safePath(root, f)))]);
  return hash(JSON.stringify(h));
}

export async function publicFiles(root) {
  const p = await packet(root, 'project'), b = await packet(root, 'implementation');
  return {p, b, out: await safePath(root, p.outputDir)};
}

export async function routeFile(out, path) {
  const candidates = path === '/' ? ['index.html'] : [path.slice(1) + '.html', path.slice(1) + '/index.html'];
  for (const x of candidates) {
    try { return await safePath(out, x); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  throw Error(`Missing content route: ${path}`);
}

const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
/** Validate a browser-qa report: fresh, right mode, no failures, every route x viewport present, real PNGs. */
export async function technical(root, ref, fp, mode, routes, c) {
  const report = await json(await evidence(root, ref));
  c(report.fingerprint === fp, 'qa.technical', `Stale ${mode} technical report`);
  c(report.mode === mode, 'qa.technical', `Wrong QA mode: ${mode}`);
  c(Array.isArray(report.failures) && report.failures.length === 0, 'qa.technical', `${mode} technical failures`);
  const seen = new Set();
  for (const k of report.cases ?? []) {
    c(k.passed === true, 'qa.technical', `${mode} case failed: ${k.path}`);
    const key = `${k.path}|${k.width}|${k.height}`;
    c(!seen.has(key), 'qa.technical', 'Duplicate QA case');
    seen.add(key);
    const bytes = await readFile(await evidence(root, k.screenshot));
    c(bytes.length > 24 && bytes.subarray(0, 8).equals(PNG) && bytes.readUInt32BE(16) === k.width && bytes.readUInt32BE(20) >= k.height, 'qa.screenshot-invalid', `Invalid/incorrect viewport screenshot: ${k.screenshot.path}`);
  }
  for (const p of routes.pages) for (const v of VIEWPORTS) c(seen.has(`${p.path}|${v.width}|${v.height}`), 'qa.technical', `Missing ${mode} case: ${p.path} ${v.width}x${v.height}`);
  return report;
}

/** A matching hash proves which bytes were reviewed, not that they passed; reject explicit failure contradictions. */
export async function flowEvidence(root, ref, c, id) {
  const path = await evidence(root, ref);
  if (!/\.json$/i.test(ref.path)) return;
  const report = await json(path);
  const failed = report?.passed === false
    || ['errors', 'failures'].some(key => Array.isArray(report?.[key]) && report[key].length > 0)
    || ['checks', 'results'].some(key => Array.isArray(report?.[key]) && report[key].some(item => item?.passed === false));
  c(!failed, 'qa.flow-failed', `Failed flow report: ${ref.path}`, {flow: id});
}
