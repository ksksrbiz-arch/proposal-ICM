import {readFile, readdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv from 'ajv';
import {files, json, within} from '../lib/files.mjs';
import {STAGES, CODES} from '../lib/gates.mjs';
import {render} from './build-gate-docs.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const paths = await files(root, {omit: ['node_modules', '.git', 'work', 'reports'].map(x => resolve(root, x))});
const issues = [];
let links = 0;
const read = p => readFile(resolve(root, p), 'utf8');
const lines = s => s.replace(/\n$/, '').split('\n').length;

// JSON validity and local Markdown links.
for (const path of paths) {
  if (path.endsWith('.json')) try { await json(resolve(root, path)); } catch { issues.push(`${path}: invalid JSON`); }
  if (path.endsWith('.md')) {
    const body = await read(path);
    for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(https?:|mailto:|#)/.test(link) || link.includes('<')) continue;
      const target = resolve(dirname(resolve(root, path)), link.split('#')[0]);
      if (!within(root, target)) issues.push(`${path}: escaping documentation link`);
      else try { await readFile(target); links++; } catch { issues.push(`${path}: broken link ${link}`); }
    }
  }
}

const ajv = new Ajv({strict: true});
for (const path of ['schemas/artifacts.schema.json', 'schemas/batch.schema.json']) if (!ajv.validateSchema(await json(resolve(root, path)))) issues.push(path + ': invalid JSON schema');

// Lesson registry.
const registry = await json(resolve(root, '.icm/learning/LESSONS.json')), lessonIds = new Set();
for (const lesson of registry.lessons) {
  if (lessonIds.has(lesson.id)) issues.push('Duplicate adopted lesson ID');
  lessonIds.add(lesson.id);
  if (!['adopted', 'candidate', 'held'].includes(lesson.status) || !lesson.rule || !lesson.why) issues.push('Incomplete learning registry entry');
  for (const code of lesson.codes ?? []) if (!CODES[code]) issues.push(`Lesson ${lesson.id} references unknown gate code ${code}`);
  for (const path of lesson.regressions ?? []) try { await read(path); } catch { issues.push('Missing lesson regression ' + path); }
}
for (const path of ['AGENTS.md', 'CLAUDE.md', '.icm/INDEX.md', 'prompts/worker.md', 'prompts/reviewer.md', 'prompts/orchestrator.md']) if (!(await read(path)).trim()) issues.push(path + ': empty instructions');

// Interpretable Context Methodology layout: routing-only router, bounded references, stage contracts.
const router = await read('CLAUDE.md');
if (lines(router) > 80) issues.push(`CLAUDE.md: ${lines(router)} lines, limit 80 (routing only)`);
if ((await read('GEMINI.md')) !== router) issues.push('GEMINI.md must be identical to CLAUDE.md');
for (const f of (await readdir(resolve(root, 'context/references'))).filter(x => x.endsWith('.md'))) {
  const n = lines(await read(`context/references/${f}`));
  if (n > 200) issues.push(`context/references/${f}: ${n} lines, limit 200`);
}
const workflows = (await readdir(resolve(root, 'context/workflows'))).sort();
const expected = STAGES.map((s, i) => `${String(i + 1).padStart(2, '0')}-${s}`);
if (JSON.stringify(workflows) !== JSON.stringify(expected)) issues.push(`context/workflows must contain exactly ${expected.join(', ')}`);
for (const w of workflows) {
  const body = await read(`context/workflows/${w}/CONTEXT.md`);
  for (const h of ['## Load', '## Do not load', '## Input', '## Process', '## Output', '## Completion']) if (!body.includes(`\n${h}\n`)) issues.push(`context/workflows/${w}: missing "${h}" section`);
  if (lines(body) > 200) issues.push(`context/workflows/${w}: over 200 lines`);
  if (!router.includes(`context/workflows/${w}/CONTEXT.md`)) issues.push(`CLAUDE.md does not route to ${w}`);
  const stub = await read(`stages/${w}/CONTEXT.md`).catch(() => '');
  if (!stub.includes(`context/workflows/${w}/CONTEXT.md`)) issues.push(`stages/${w}: compatibility stub missing or not pointing to the workflow`);
}
if (await read('context/references/gates.md') !== render()) issues.push('context/references/gates.md is stale: run npm run docs:gates');

console.log(JSON.stringify({files: paths.length, localDocLinks: links, issues}, null, 2));
if (issues.length) process.exitCode = 1;
