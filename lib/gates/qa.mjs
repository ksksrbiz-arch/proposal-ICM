import {fingerprint, packet, technical, flowEvidence} from './shared.mjs';
export async function qa(ctx, c) {
  const {root, routes, flows} = ctx;
  const fp = ctx.fp = await fingerprint(root), q = ctx.q = await packet(root, 'qa');
  c(q.fingerprint === fp, 'qa.stale', 'Stale qa.json');
  ctx.localReport = await technical(root, q.technical, fp, 'local', routes, c);
  c.unique(q.flows.map(x => x.id), 'QA flow IDs', 'qa.flow-failed');
  for (const f of flows.entries) {
    const test = q.flows.find(x => x.id === f.id);
    c(test?.passed === true, 'qa.flow-failed', `Untested/failed flow: ${f.id}`);
    if (test) await flowEvidence(root, test.evidence, c, f.id);
  }
  for (const x of q.defects) {
    if (['critical', 'high'].includes(x.severity)) c(x.status === 'resolved', 'qa.defect-open', `Release blocker: ${x.id}`);
    if (x.status !== 'resolved') c(x.disposition.trim().length >= 12, 'qa.defect-open', `No defect disposition: ${x.id}`);
  }
}
