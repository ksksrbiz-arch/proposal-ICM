import {evidence} from '../files.mjs';
import {packet} from './shared.mjs';
export async function review(ctx, c) {
  const {root, p, routes, fp, localReport} = ctx;
  const v = await packet(root, 'review');
  c(v.fingerprint === fp, 'review.stale', 'Stale independent review');
  c(v.reviewedBy === p.reviewer && v.reviewedBy !== p.builder, 'review.stale', 'Independent reviewer mismatch');
  c.unique(v.coverage.map(x => x.path), 'review coverage', 'review.coverage');
  for (const x of routes.pages) {
    const cov = v.coverage.find(k => k.path === x.path);
    c(!!cov, 'review.coverage', `Route not visually reviewed: ${x.path}`);
    if (!cov) continue;
    for (const [key, width] of [['mobile', 390], ['desktop', 1440]]) {
      await evidence(root, cov[key]);
      const shot = localReport.cases.find(r => r.path === x.path && r.width === width)?.screenshot;
      c(shot?.sha256 === cov[key].sha256 && shot?.path === cov[key].path, 'review.coverage', `Review references wrong route/viewport screenshot: ${x.path} ${key}`);
    }
  }
  const scores = Object.values(v.scores);
  c(scores.every(n => n >= 4) && scores.reduce((s, n) => s + n, 0) >= 26, 'review.score', 'Design review score below bar');
}
