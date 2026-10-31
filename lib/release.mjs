import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fingerprint,validateGate,publicFiles} from './gates.mjs';
import {json,putJson,hash,safePath,reference,webUrl} from './files.mjs';
export async function seal(root){await validateGate(root,'review');const {p,b,out}=await publicFiles(root);const records=[];for(const path of [...b.allowlist].sort())records.push({path,sha256:hash(await readFile(await safePath(out,path))),configOnly:b.configOnly.includes(path)});const record={schemaVersion:1,projectId:p.projectId,buildStamp:b.buildStamp,fingerprint:await fingerprint(root),sealedAt:new Date().toISOString(),files:records};await putJson(resolve(root,'sealed-build.json'),record);return {files:records.length,fingerprint:record.fingerprint};}
export async function verifyPublic(root,stableUrl,immutableUrl){
 if(!webUrl(stableUrl)||!webUrl(immutableUrl)||new URL(stableUrl).protocol!=='https:'||new URL(immutableUrl).protocol!=='https:'||new URL(stableUrl).origin===new URL(immutableUrl).origin)throw Error('Two distinct HTTPS deployment origins required');
 for(const s of [stableUrl,immutableUrl]){const u=new URL(s);if(u.pathname!=='/'||u.search||u.hash)throw Error('Deployment URL must be origin only');}
 await validateGate(root,'review');const {p,b}=await publicFiles(root);if(!p.permissions.publish.granted)throw Error('Publication verification requires recorded publication authority');
 const sealed=await json(resolve(root,'sealed-build.json')),fp=await fingerprint(root);if(sealed.fingerprint!==fp)throw Error('Stale sealed build');
 const checks=[],errors=[];const probes=['/research/','/research.json','/project.json','/STATE.json','/qa/report.json','/README.md','/.env','/package.json','/build.mjs','/originals/','/__icm_missing_route__'];
 for(const base of [stableUrl,immutableUrl]){
  for(const f of sealed.files.filter(x=>!x.configOnly)){
   const url=new URL(f.path,base.endsWith('/')?base:base+'/').href;
   try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await r.arrayBuffer());const expectedStatus=f.path==='404.html'?404:200;const data={url,status:r.status,sha256:hash(bytes)};if(r.status!==expectedStatus)throw Error(`Expected HTTP${expectedStatus}, got ${r.status}`);if(data.sha256!==f.sha256)throw Error('Public bytes differ from sealed build');if(f.path.endsWith('.html')){if(!/noindex/i.test(r.headers.get('x-robots-tag')??''))throw Error('Missing effective noindex header');if(!/<meta\b[^>]*name=["']robots["'][^>]*noindex|<meta\b[^>]*content=["'][^"']*noindex[^>]*name=["']robots/i.test(bytes.toString()))throw Error('Missing noindex meta');}if(f.path==='deployment.json'){const m=JSON.parse(bytes);if(m.projectId!==p.projectId||m.buildStamp!==b.buildStamp)throw Error('Wrong public marker');}checks.push(data);}catch(e){errors.push({url,error:e.message});}
  }
  for(const path of [...probes,...b.configOnly.map(x=>'/'+x)]){const url=new URL(path,base).href;try{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(r.status!==404)throw Error(`Private/missing path returned ${r.status}`);checks.push({url,status:404});}catch(e){errors.push({url,error:e.message});}}
 }
 const record={schemaVersion:1,checkedAt:new Date().toISOString(),fingerprint:fp,stableUrl,immutableUrl,passed:errors.length===0,checks,errors};await putJson(resolve(root,'public-verification.json'),record);const pub=await json(resolve(root,'publication.json'));pub.publicVerification=await reference(root,'public-verification.json');await putJson(resolve(root,'publication.json'),pub);
 if(errors.length)throw Error(`${errors.length} publication checks failed; see public-verification.json`);return {checks:checks.length,passed:true};
}
