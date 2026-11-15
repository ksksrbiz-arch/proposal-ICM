import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {json, hash, safePath, evidence, webUrl} from '../files.mjs';
import {packet, technical, timestamp} from './shared.mjs';
export async function publish(ctx, c) {
  const {root, p, b, out, fp, routes} = ctx;
  c(p.permissions.publish.granted, 'publish.not-authorized', 'Publication not authorized');
  const seal = await json(resolve(root, 'sealed-build.json'));
  c(seal.fingerprint === fp, 'publish.seal', 'Build seal is stale');
  for (const f of seal.files) c(hash(await readFile(await safePath(out, f.path))) === f.sha256, 'publish.seal', `Sealed file changed: ${f.path}`);
  c(JSON.stringify(seal.files.map(x => x.path).sort()) === JSON.stringify([...b.allowlist].sort()), 'publish.seal', 'Seal file set mismatch');
  const pub = await packet(root, 'publication');
  c(pub.status === 'success', 'publish.provider', 'Provider publication is not successful');
  const https = u => webUrl(u) && new URL(u).protocol === 'https:';
  c(https(pub.stableUrl) && https(pub.immutableUrl) && new URL(pub.stableUrl).origin !== new URL(pub.immutableUrl).origin, 'publish.provider', 'Distinct HTTPS provider verified URLs required');
  c(pub.buildStamp === b.buildStamp && timestamp(pub.deployedAt), 'publish.provider', 'Publication stamp/date mismatch');
  await evidence(root, pub.receipt);
  const hosted = await technical(root, pub.hostedQa, fp, 'hosted', routes, c);
  c(webUrl(hosted.baseUrl) && webUrl(pub.stableUrl) && new URL(hosted.baseUrl).origin === new URL(pub.stableUrl).origin, 'publish.hosted', 'Hosted QA targets wrong preview');
  const verification = await json(await evidence(root, pub.publicVerification));
  c(verification.fingerprint === fp && verification.passed === true && verification.stableUrl === pub.stableUrl && verification.immutableUrl === pub.immutableUrl, 'publish.hosted', 'Public verification missing/stale/wrong deployment');
}
