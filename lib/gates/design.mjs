import {webUrl, routePath} from '../files.mjs';
import {packet} from './shared.mjs';
export async function design(ctx, c) {
  const {root, p, r, a, sourceIds} = ctx;
  const d = ctx.d = await packet(root, 'design'), routes = ctx.routes = await packet(root, 'routes'), flows = ctx.flows = await packet(root, 'flows');
  c(d.conceptReviewedBy === p.reviewer, 'design.concept-review-missing', 'Root concept review missing');
  c.unique(routes.pages.map(x => x.path), 'routes');
  c.unique(flows.entries.map(x => x.id), 'flow IDs');
  const paths = new Set(routes.pages.map(x => x.path)), assetMap = new Map(a.entries.map(x => [x.id, x])), baselineIds = new Set(r.baseline.pages.map(x => x.id));
  for (const x of routes.pages) {
    c(routePath(x.path), 'design.route-invalid', `Invalid route path: ${x.path}`);
    c(x.primaryAction.target !== '#' && !/^(javascript:|about:blank)/i.test(x.primaryAction.target), 'design.route-action-dead', `Dead primary action: ${x.path}`);
    for (const id of x.sourceIds) c(sourceIds.has(id), 'design.route-source-unknown', `Unknown route source: ${id}`);
    for (const id of x.assetIds) c(assetMap.get(id)?.allowedForProposal, 'design.route-asset-unapproved', `Unapproved/unknown route asset: ${id}`);
    for (const id of x.baselineIds) c(baselineIds.has(id), 'design.route-baseline-unknown', `Unknown baseline coverage: ${id}`);
  }
  c(paths.has('/'), 'design.homepage-missing', 'Homepage missing');
  const core = routes.pages.filter(x => x.type === 'core');
  if (r.baseline.status === 'known') {
    const baseline = r.baseline.pages.filter(x => x.type === 'core');
    c(core.length >= baseline.length, 'design.parity-count', 'Meaningful core-page parity failed');
    for (const old of baseline) c(core.some(x => x.baselineIds.includes(old.id)), 'design.parity-uncovered', `Uncovered existing core page: ${old.id}`);
  }
  for (const f of flows.entries) {
    c(paths.has(f.entry), 'design.flow-entry-unknown', `Unknown flow entry: ${f.id}`);
    if (f.behavior === 'external-handoff') c(webUrl(f.destination) || /^(tel:|mailto:|sms:)/i.test(f.destination), 'design.flow-handoff-invalid', `Invalid external handoff: ${f.id}`);
  }
}
