import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {json, files, safePath} from '../files.mjs';
import {publicFiles, routeFile} from './shared.mjs';
import {lintSite} from '../quality/static.mjs';

const BANNED = /(^|\/)(research|qa|evidence|originals|private|src|source|node_modules|\.git|\.wrangler)(\/|$)|(^|\/)(project|STATE|research|assets|design|routes|flows|implementation|qa|review|publication|tracker|sealed-build|public-verification)\.json$|(^|\/)(README|HANDOFF|AGENTS)\.md$|(^|\/)\.env|\.(mjs|ts|tsx|map|log|pem|key|csv|xlsx)$/i;

export async function build(ctx, c) {
  const {root, p, routes} = ctx;
  const {b, out} = await publicFiles(root);
  ctx.b = b; ctx.out = out;
  await safePath(root, b.sourceDir);
  c.unique(b.allowlist, 'allowlist entries', 'build.allowlist-mismatch');
  const actual = await files(out);
  c(JSON.stringify([...b.allowlist].sort()) === JSON.stringify(actual), 'build.allowlist-mismatch', 'Public directory differs from allowlist');
  for (const f of b.allowlist) {
    await safePath(out, f);
    c(!BANNED.test(f) && (!f.endsWith('.json') || f === 'deployment.json'), 'build.private-file-public', `Private/source file in public output: ${f}`);
  }
  for (const f of b.configOnly) c(b.allowlist.includes(f) && ['_headers', '_redirects'].includes(f), 'build.config-only-unsupported', `Unsupported config-only file: ${f}`);
  c(['404.html', 'deployment.json', 'robots.txt'].every(f => b.allowlist.includes(f)), 'build.release-files-missing', 'Custom404, robots policy or deployment marker missing');
  if (b.allowlist.includes('robots.txt')) c(/^\s*Disallow:\s*\/\s*$/im.test(await readFile(resolve(out, 'robots.txt'), 'utf8')), 'build.robots-open', 'Preview robots exclusion missing');
  if (b.allowlist.includes('deployment.json')) {
    const marker = await json(resolve(out, 'deployment.json'));
    c(marker.projectId === p.projectId && marker.buildStamp === b.buildStamp, 'build.marker-mismatch', 'Build marker identity mismatch');
  }
  for (const x of routes.pages) await routeFile(out, x.path);
  for (const f of b.flowTestFiles) await safePath(root, f);
  // Static quality: unsourced claims, placeholders, structure and link hygiene on the actual public bytes.
  const lint = await lintSite(out, b.allowlist, ctx.r);
  for (const f of lint.fail) c(false, f.code, f.message);
  ctx.warnings.push(...lint.warn);
}
