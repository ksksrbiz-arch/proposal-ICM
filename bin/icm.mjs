#!/usr/bin/env node
import {mkdir, readdir, writeFile, realpath} from 'node:fs/promises';
import {resolve, basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {json, putJson, within} from '../lib/files.mjs';
import {templates} from '../lib/templates.mjs';
import {STAGES, validateGate, collectGates, fingerprint, validateBatch, packet, GateError, CODES} from '../lib/gates.mjs';
import {retrospect, lessons, learningCandidate} from '../lib/learning.mjs';
import {browserQa} from '../lib/browser-qa.mjs';
import {seal, verifyPublic} from '../lib/release.mjs';
import {doctor} from '../lib/doctor.mjs';

const kit = fileURLToPath(new URL('../', import.meta.url));
const help = `Proposal ICM (Interpretable Context Methodology kit)

Usage: proposal-icm <command> [args] [--json]

Setup
  --version | root | doctor
  init <privateDir>
Gates
  status <privateDir>
  gate <privateDir> <${STAGES.join('|')}|all>   'all' reports every stage's issues without stopping
  advance <privateDir> <stage>
  explain <code>                  what a gate code means and how to repair it
  fingerprint <privateDir>
Evidence and release
  browser-qa <privateDir> <baseUrl> <local|hosted>
  seal <privateDir>
  verify-public <privateDir> <stableUrl> <immutableUrl>
Batch and learning
  batch <manifest.json>
  lessons [stage]
  retrospect <privateDir> <completed|blocked|failed|interrupted>
  learning-candidate <privateDir> <lesson-id>

--json prints machine-readable output (also for failures). Exit code 1 means blocked.
No command deploys, changes a spreadsheet or sends outreach. See context/references/commands.md.`;

async function init(root) {
  if (within(kit, root) && !within(resolve(kit, 'work'), root)) throw Error('Real projects must be outside the public kit or under ignored work/');
  try { if ((await readdir(root)).length) throw Error('Refusing nonempty project folder'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  await mkdir(root, {recursive: true});
  for (const [name, value] of Object.entries(templates(basename(root)))) await putJson(resolve(root, name), value);
  await writeFile(resolve(root, 'HANDOFF.md'), '# New proposal assignment\n\nFill the verified brief and authority before building. Read the pinned ICM AGENTS.md and current stage. No release evidence exists yet.\n');
  return {project: root, stage: 'brief', authority: 'none; actual user instruction required'};
}

async function status(root) {
  const state = await json(resolve(root, 'STATE.json')), project = await json(resolve(root, 'project.json'));
  let fp; try { fp = await fingerprint(root); } catch { /* inputs incomplete */ }
  return {projectId: project.projectId, state, fingerprint: fp ?? 'not built/inputs incomplete'};
}

async function gateOrAdvance(command, root, stage) {
  if (command === 'gate' && stage === 'all') return collectGates(root);
  const result = await validateGate(root, stage);
  if (command === 'advance') {
    const state = await json(resolve(root, 'STATE.json'));
    state.completed = [...new Set([...state.completed, ...result.passed])];
    if (stage === 'learn') {
      state.learningStatus = 'reviewed';
      state.lastLearningRunId = result.runId;
      if (state.currentStage === 'learn' && result.outcome === 'completed') state.currentStage = 'complete';
    } else state.currentStage = STAGES[STAGES.indexOf(stage) + 1] ?? 'complete';
    state.events.push({at: new Date().toISOString(), completedThrough: stage, fingerprint: result.fingerprint ?? null});
    await putJson(resolve(root, 'STATE.json'), state);
  }
  return result;
}

export async function run(args) {
  const [command, dir, ...rest] = args;
  if (!command || ['help', '--help', '-h'].includes(command)) return help;
  if (['--version', 'version', '-v'].includes(command)) return (await json(resolve(kit, 'package.json'))).version;
  if (command === 'root') return kit;
  if (command === 'doctor') return doctor();
  if (command === 'lessons') return lessons(dir);
  if (command === 'explain') {
    const entry = CODES[dir];
    if (!entry) throw Error(`Unknown code. Known codes:\n${Object.keys(CODES).join('\n')}`);
    return entry;
  }
  if (!dir) throw Error('Missing project/manifest path');
  const root = resolve(dir);
  switch (command) {
    case 'init': return init(root);
    case 'batch': return validateBatch(root);
    case 'status': return status(root);
    case 'fingerprint': return fingerprint(root);
    case 'gate': case 'advance': return gateOrAdvance(command, root, rest[0]);
    case 'browser-qa': return browserQa(root, rest[0], rest[1]);
    case 'seal': return seal(root);
    case 'verify-public': return verifyPublic(root, rest[0], rest[1]);
    case 'retrospect': return retrospect(root, rest[0], fingerprint);
    case 'learning-candidate': return learningCandidate(root, rest[0], packet);
    default: throw Error('Unknown command; run help');
  }
}

export function render(result, asJson) {
  if (typeof result === 'string') return result;
  return JSON.stringify(result, null, asJson ? 0 : 2);
}

// npm uses a symlink for POSIX bins. Resolve it before deciding whether this is the entry point.
let entry = false;
try { entry = !!process.argv[1] && (await realpath(process.argv[1])) === (await realpath(fileURLToPath(import.meta.url))); } catch { /* not the entry point */ }
if (entry) {
  const asJson = process.argv.includes('--json'), args = process.argv.slice(2).filter(a => a !== '--json');
  try {
    const result = await run(args);
    console.log(render(result, asJson));
    if (result?.ok === false) process.exitCode = 1;
  } catch (e) {
    if (asJson) console.log(JSON.stringify({ok: false, error: e.message, stage: e.stage ?? null, issues: e.issues ?? []}));
    else {
      console.error('ICM BLOCKED: ' + (e instanceof GateError ? `${e.stage} gate, ${e.issues.length} issue(s)` : e.message));
      if (e instanceof GateError) for (const i of e.issues) console.error(`  [${i.code}] ${i.message}`);
      if (e instanceof GateError) console.error('Run `proposal-icm explain <code>` for the repair path.');
    }
    process.exitCode = 1;
  }
}
