// Gate runner. Stage logic lives in lib/gates/<stage>.mjs; this file orders stages,
// collects every issue per stage, and keeps the public API stable.
import {resolve, dirname} from 'node:path';
import {json, within} from './files.mjs';
import {validateLearning} from './learning.mjs';
import {STAGES, VIEWPORTS, packet, fingerprint, publicFiles, routeFile, compileBatch, ajvErrors} from './gates/shared.mjs';
import {GateError, checker} from './gates/issues.mjs';
import {CODES} from './gates/catalog.mjs';
import {brief} from './gates/brief.mjs';
import {research} from './gates/research.mjs';
import {design} from './gates/design.mjs';
import {build} from './gates/build.mjs';
import {qa} from './gates/qa.mjs';
import {review} from './gates/review.mjs';
import {publish} from './gates/publish.mjs';
import {register} from './gates/register.mjs';

export {STAGES, VIEWPORTS, packet, fingerprint, publicFiles, routeFile, GateError, CODES};
const RUNNERS = {brief, research, design, build, qa, review, publish, register};

/** Run one stage. Failed checks become issues; unexpected errors with no prior issue propagate unchanged. */
async function runStage(ctx, stage) {
  const {issues, check} = checker(stage);
  try { await RUNNERS[stage](ctx, check); }
  catch (e) {
    if (!issues.length) throw e;
    issues.push({stage, code: 'gate.unreadable', message: `${e.name}: ${e.message}`});
  }
  return issues;
}

/** Throws GateError (all issues of the first failing stage) or returns {passed, fingerprint?, warnings}. */
export async function validateGate(root, stage) {
  if (stage === 'learn') return validateLearning(resolve(root), packet);
  root = resolve(root);
  const stop = STAGES.indexOf(stage);
  if (stop < 0) throw Error(`Unknown stage: ${stage}`);
  const ctx = {root, warnings: []}, passed = [];
  for (const s of STAGES.slice(0, stop + 1)) {
    const issues = await runStage(ctx, s);
    if (issues.length) throw new GateError(s, issues);
    passed.push(s);
  }
  const result = {passed};
  if (stop >= 4) result.fingerprint = ctx.fp;
  if (ctx.warnings.length) result.warnings = ctx.warnings;
  return result;
}

/** Non-throwing report over every release stage: pass | fail | blocked (an earlier stage failed). */
export async function collectGates(root) {
  root = resolve(root);
  const ctx = {root, warnings: []}, stages = [];
  let blockedBy = null;
  for (const s of STAGES.filter(x => x !== 'learn')) {
    if (blockedBy) { stages.push({stage: s, status: 'blocked', blockedBy, issues: []}); continue; }
    let issues;
    try { issues = await runStage(ctx, s); }
    catch (e) { issues = [{stage: s, code: 'gate.unreadable', message: `${e.name}: ${e.message}`}]; }
    if (issues.length) { blockedBy = s; stages.push({stage: s, status: 'fail', issues}); } else stages.push({stage: s, status: 'pass', issues: []});
  }
  return {ok: !blockedBy, stages, warnings: ctx.warnings, fingerprint: ctx.fp ?? null};
}

const tokens = s => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2));
export function similarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const t of A) if (B.has(t)) both++;
  return both / (A.size + B.size - both);
}

export async function validateBatch(path) {
  const {issues, check} = checker('brief');
  const batch = await json(path), v = await compileBatch();
  if (!v(batch)) throw Error(ajvErrors(v));
  check.unique(batch.jobs.map(x => x.projectId), 'batch lead IDs', 'batch.invalid');
  check.unique(batch.jobs.map(x => resolve(dirname(path), x.projectDir).toLowerCase()), 'batch folders', 'batch.invalid');
  const signatures = new Map();
  for (const j of batch.jobs) {
    const root = resolve(dirname(path), j.projectDir);
    for (const other of batch.jobs) {
      if (other === j) continue;
      check(!within(root, resolve(dirname(path), other.projectDir)), 'batch.invalid', 'Overlapping worker folders');
    }
    try {
      const p = await packet(root, 'project');
      check(p.projectId === j.projectId && p.instructionCommit === batch.instructionCommit && p.scope === j.scope, 'batch.invalid', 'Assignment/pin mismatch');
      const proposed = await json(resolve(root, 'design.json'));
      if (!proposed.conceptReviewedBy) continue;
      const d = await packet(root, 'design');
      const s = d.layoutSignature.toLowerCase().replace(/\s+/g, ' ').trim();
      check(!signatures.has(s), 'batch.similar-design', `Repeated batch design signature: ${j.projectId}`);
      for (const [other, id] of signatures) check(similarity(s, other) < 0.8, 'batch.similar-design', `Near-identical batch design signature: ${j.projectId} vs ${id}`);
      signatures.set(s, j.projectId);
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  if (issues.length) throw new GateError('brief', issues);
  return {batchId: batch.batchId, jobs: batch.jobs.length, existingDesigns: signatures.size};
}
