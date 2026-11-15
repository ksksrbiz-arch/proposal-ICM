import {readFile} from 'node:fs/promises';
import {hash, safePath, webUrl} from '../files.mjs';
import {packet, timestamp} from './shared.mjs';
export async function research(ctx, c) {
  const {root, p} = ctx;
  const r = ctx.r = await packet(root, 'research'), a = ctx.a = await packet(root, 'assets');
  c(r.identity.matched, 'research.identity-unresolved', 'Business identity unresolved');
  c.unique(r.sources.map(x => x.id), 'source IDs');
  const sourceIds = ctx.sourceIds = new Set(r.sources.map(x => x.id));
  for (const s of r.sources) c(webUrl(s.url) && timestamp(s.checkedAt), 'research.source-invalid', `Invalid source URL/date: ${s.id}`);
  for (const id of r.identity.sourceIds) c(sourceIds.has(id), 'research.source-unknown', `Unknown identity source: ${id}`);
  for (const f of r.facts) {
    for (const id of f.sourceIds) c(sourceIds.has(id), 'research.source-unknown', `Unknown fact source: ${id}`);
    if (f.publicUse) {
      c(f.sourceIds.length > 0, 'research.fact-unsupported', `Unsupported public fact: ${f.id}`);
      if (f.status !== 'KNOWN') c(f.qualification.trim().length >= 12, 'research.fact-unqualified', `Unqualified public uncertainty: ${f.id}`);
    }
  }
  for (const url of r.baseline.checkedUrls) c(webUrl(url), 'research.baseline-url-invalid', 'Invalid baseline URL');
  c.unique(r.baseline.pages.map(x => x.id), 'baseline IDs');
  if (r.baseline.status === 'known') c(r.baseline.pages.some(x => x.type === 'core' && x.accessible), 'research.baseline-no-core', 'Known baseline needs meaningful accessible core pages');
  else c(r.baseline.limitations.trim().length >= 12, 'research.baseline-limitations-missing', 'Unknown/absent baseline needs limitations');
  if (p.scope === 'first-site') c(r.baseline.status === 'no-company-site-found', 'research.first-site-ineligible', 'First-site scope has no checked-source eligibility');
  c.unique(a.entries.map(x => x.id), 'asset IDs');
  for (const x of a.entries) {
    c(webUrl(x.sourceUrl) || x.sourceUrl === 'original-generated', 'research.asset-source-invalid', `Invalid asset source: ${x.id}`);
    if (x.allowedForProposal) {
      c(x.inspected, 'research.asset-uninspected', 'Uninspected asset');
      c(x.identityMatched || ['generated-illustration', 'licensed-illustration', 'font'].includes(x.kind), 'research.asset-identity-mismatch', 'Asset identity mismatch');
      const bytes = await readFile(await safePath(root, x.path));
      c(hash(bytes) === x.sha256, 'research.asset-changed', `Original asset changed: ${x.id}`);
    }
  }
}
