import {appendFile, readFile, mkdir, access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {json} from './files.mjs';
import {CODES} from './gates/catalog.mjs';

// Automatic usage capture. Every gate-class command in a private project appends one line to
// evidence/usage-log.jsonl: command, stage, ok, issue codes. Never messages, URLs or business text,
// so the log can feed cross-project insights. Best effort: logging must never block or change a result.
export const USAGE_LOG = 'evidence/usage-log.jsonl';
const kitVersion = (await json(resolve(fileURLToPath(new URL('../', import.meta.url)), 'package.json'))).version;

export async function recordUsage(root, entry) {
  try {
    await access(resolve(root, 'project.json'));
    await mkdir(resolve(root, 'evidence'), {recursive: true});
    await appendFile(resolve(root, USAGE_LOG), JSON.stringify({at: new Date().toISOString(), kit: kitVersion, ...entry}) + '\n');
  } catch { /* not a project, or read-only: learning capture is optional, the command is not */ }
}

export async function readUsage(root) {
  try {
    return (await readFile(resolve(root, USAGE_LOG), 'utf8')).split('\n').filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  } catch { return []; }
}

/** Failure counts per code and stage, plus rework = number of blocked gate-class runs. */
export function summarizeUsage(events) {
  const codes = new Map(), stages = new Map();
  let rework = 0;
  for (const e of events) {
    const s = stages.get(e.stage) ?? {stage: e.stage, runs: 0, failures: 0};
    s.runs++;
    if (!e.ok) {
      s.failures++; rework++;
      for (const c of new Set(e.codes ?? [])) codes.set(c, (codes.get(c) ?? 0) + 1);
    }
    stages.set(e.stage, s);
  }
  return {
    events: events.length, rework,
    stages: [...stages.values()],
    codes: [...codes].map(([code, failures]) => ({code, stage: CODES[code]?.stage ?? 'unknown', failures})).sort((a, b) => b.failures - a.failures)
  };
}

/** Pool usage logs from several private projects. Only codes and counts leave each project. */
export async function insights(roots, lessons) {
  const perCode = new Map();
  let events = 0;
  for (const root of roots) {
    const u = summarizeUsage(await readUsage(root));
    events += u.events;
    for (const c of u.codes) {
      const e = perCode.get(c.code) ?? {code: c.code, stage: c.stage, projects: 0, failures: 0};
      e.projects++; e.failures += c.failures;
      perCode.set(c.code, e);
    }
  }
  const covered = code => lessons.filter(l => (l.codes ?? []).includes(code)).map(l => l.id);
  const recurring = [...perCode.values()].sort((a, b) => b.projects - a.projects || b.failures - a.failures).map(e => ({
    ...e, coveredByLessons: covered(e.code),
    candidate: e.projects >= 2 && covered(e.code).length === 0
  }));
  return {
    projects: roots.length, events, recurring,
    note: 'Candidates are leads for a root-reviewed retrospective, never adopted rules. Adoption needs independent and privacy review, before/after evidence and a promotion commit (see context/workflows/09-learn/CONTEXT.md).'
  };
}
