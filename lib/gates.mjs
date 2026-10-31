import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv from 'ajv';
import {json,hash,files,safePath,evidence,webUrl,routePath,within} from './files.mjs';
export const STAGES=['brief','research','design','build','qa','review','publish','register'];
export const VIEWPORTS=[{width:320,height:800},{width:390,height:844},{width:768,height:1024},{width:1024,height:768},{width:1440,height:1000},{width:844,height:390}];
const kit=fileURLToPath(new URL('../',import.meta.url));
const ajv=new Ajv({allErrors:true,strict:true});
const schema=await json(resolve(kit,'schemas/artifacts.schema.json'));
const validators=new Map();
const requireTrue=(yes,message)=>{if(!yes)throw Error(message);};
function unique(values,label){requireTrue(new Set(values).size===values.length,`Duplicate ${label}`);}
function timestamp(s){return typeof s==='string'&&Number.isFinite(Date.parse(s));}
export async function packet(root,name){const value=await json(resolve(root,name+'.json'));let v=validators.get(name);if(!v){v=ajv.compile({$ref:`#/definitions/${name}`,definitions:schema.definitions});validators.set(name,v);}requireTrue(v(value),`${name}.json: ${ajv.errorsText(v.errors,{separator:'; '})}`);return value;}
export async function fingerprint(root){
 const h=[];for(const n of ['project','research','assets','design','routes','flows','implementation']){if(n==='project'){const {permissions,...buildInputs}=await json(resolve(root,n+'.json'));h.push([n,hash(JSON.stringify(buildInputs))]);}else h.push([n,hash(await readFile(resolve(root,n+'.json')))]);}
 const p=await packet(root,'project'),b=await packet(root,'implementation'),out=await safePath(root,p.outputDir),source=await safePath(root,b.sourceDir);
 requireTrue(within(root,source),'Source escapes project');
 for(const f of await files(source,{omit:[out,resolve(source,'node_modules'),resolve(source,'.git')]}))h.push(['source/'+f,hash(await readFile(await safePath(source,f)))]);
 for(const f of [...b.allowlist].sort())h.push(['public/'+f,hash(await readFile(await safePath(out,f)))]);
 for(const f of b.flowTestFiles)h.push(['test/'+f,hash(await readFile(await safePath(root,f)))]);
 return hash(JSON.stringify(h));
}
export async function publicFiles(root){const p=await packet(root,'project'),b=await packet(root,'implementation');const out=await safePath(root,p.outputDir);return {p,b,out};}
export async function routeFile(out,path){const candidates=path==='/'?['index.html']:[path.slice(1)+'.html',path.slice(1)+'/index.html'];for(const x of candidates){try{return await safePath(out,x);}catch(e){if(e.code!=='ENOENT')throw e;}}throw Error(`Missing content route: ${path}`);}
async function technical(root,ref,fp,mode,routes){
 const report=await json(await evidence(root,ref));requireTrue(report.fingerprint===fp,`Stale ${mode} technical report`);requireTrue(report.mode===mode,`Wrong QA mode: ${mode}`);requireTrue(Array.isArray(report.failures)&&report.failures.length===0,`${mode} technical failures`);
 const seen=new Set();for(const c of report.cases??[]){requireTrue(c.passed===true,`${mode} case failed: ${c.path}`);const key=`${c.path}|${c.width}|${c.height}`;requireTrue(!seen.has(key),'Duplicate QA case');seen.add(key);const bytes=await readFile(await evidence(root,c.screenshot));requireTrue(bytes.length>24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.readUInt32BE(16)===c.width&&bytes.readUInt32BE(20)>=c.height,`Invalid/incorrect viewport screenshot: ${c.screenshot.path}`);}
 for(const p of routes.pages)for(const v of VIEWPORTS)requireTrue(seen.has(`${p.path}|${v.width}|${v.height}`),`Missing ${mode} case: ${p.path} ${v.width}x${v.height}`);
 return report;
}
export async function validateGate(root,stage){
 root=resolve(root);const stop=STAGES.indexOf(stage);requireTrue(stop>=0,`Unknown stage: ${stage}`);const passed=[];
 const p=await packet(root,'project');requireTrue(p.permissions.build.granted,'Build authority not recorded');
 for(const [action,a] of Object.entries(p.permissions))if(a.granted)requireTrue(a.instruction.trim().length>=12&&timestamp(a.at),`Missing actual user instruction/date for ${action}`);
 requireTrue(p.builder!==p.reviewer,'Builder and independent reviewer must differ');await safePath(root,p.outputDir,{mustExist:false});passed.push('brief');if(stop===0)return {passed};
 const r=await packet(root,'research'),a=await packet(root,'assets');requireTrue(r.identity.matched,'Business identity unresolved');unique(r.sources.map(x=>x.id),'source IDs');const sourceIds=new Set(r.sources.map(x=>x.id));
 for(const s of r.sources)requireTrue(webUrl(s.url)&&timestamp(s.checkedAt),`Invalid source URL/date: ${s.id}`);
 for(const id of r.identity.sourceIds)requireTrue(sourceIds.has(id),`Unknown identity source: ${id}`);
 for(const f of r.facts){for(const id of f.sourceIds)requireTrue(sourceIds.has(id),`Unknown fact source: ${id}`);if(f.publicUse){requireTrue(f.sourceIds.length>0,`Unsupported public fact: ${f.id}`);if(f.status!=='KNOWN')requireTrue(f.qualification.trim().length>=12,`Unqualified public uncertainty: ${f.id}`);}}
 for(const url of r.baseline.checkedUrls)requireTrue(webUrl(url),'Invalid baseline URL');unique(r.baseline.pages.map(x=>x.id),'baseline IDs');
 if(r.baseline.status==='known')requireTrue(r.baseline.pages.some(x=>x.type==='core'&&x.accessible),'Known baseline needs meaningful accessible core pages');
 else requireTrue(r.baseline.limitations.trim().length>=12,'Unknown/absent baseline needs limitations');
 if(p.scope==='first-site')requireTrue(r.baseline.status==='no-company-site-found','First-site scope has no checked-source eligibility');
 unique(a.entries.map(x=>x.id),'asset IDs');for(const x of a.entries){requireTrue(webUrl(x.sourceUrl)||x.sourceUrl==='original-generated',`Invalid asset source: ${x.id}`);if(x.allowedForProposal){requireTrue(x.inspected,'Uninspected asset');requireTrue(x.identityMatched||['generated-illustration','licensed-illustration','font'].includes(x.kind),'Asset identity mismatch');const bytes=await readFile(await safePath(root,x.path));requireTrue(hash(bytes)===x.sha256,`Original asset changed: ${x.id}`);}}
 passed.push('research');if(stop===1)return {passed};
 const d=await packet(root,'design'),routes=await packet(root,'routes'),flows=await packet(root,'flows');requireTrue(d.conceptReviewedBy===p.reviewer,'Root concept review missing');unique(routes.pages.map(x=>x.path),'routes');unique(flows.entries.map(x=>x.id),'flow IDs');
 const paths=new Set(routes.pages.map(x=>x.path)),assetMap=new Map(a.entries.map(x=>[x.id,x])),baselineIds=new Set(r.baseline.pages.map(x=>x.id));
 for(const x of routes.pages){requireTrue(routePath(x.path),`Invalid route path: ${x.path}`);requireTrue(x.primaryAction.target!=='#'&&!/^(javascript:|about:blank)/i.test(x.primaryAction.target),'Dead primary action');for(const id of x.sourceIds)requireTrue(sourceIds.has(id),`Unknown route source: ${id}`);for(const id of x.assetIds)requireTrue(assetMap.get(id)?.allowedForProposal,`Unapproved/unknown route asset: ${id}`);for(const id of x.baselineIds)requireTrue(baselineIds.has(id),`Unknown baseline coverage: ${id}`);}
 requireTrue(paths.has('/'),'Homepage missing');
 const core=routes.pages.filter(x=>x.type==='core');if(r.baseline.status==='known'){const baseline=r.baseline.pages.filter(x=>x.type==='core'&&x.accessible);requireTrue(core.length>=baseline.length,'Meaningful core-page parity failed');for(const old of baseline)requireTrue(core.some(x=>x.baselineIds.includes(old.id)),`Uncovered existing core page: ${old.id}`);}
 for(const f of flows.entries){requireTrue(paths.has(f.entry),`Unknown flow entry: ${f.id}`);if(f.behavior==='external-handoff')requireTrue(webUrl(f.destination)||/^(tel:|mailto:|sms:)/i.test(f.destination),`Invalid external handoff: ${f.id}`);}
 passed.push('design');if(stop===2)return {passed};
 const {b,out}=await publicFiles(root);await safePath(root,b.sourceDir);unique(b.allowlist,'allowlist entries');const actual=await files(out);requireTrue(JSON.stringify([...b.allowlist].sort())===JSON.stringify(actual),'Public directory differs from allowlist');
 const banned=/(^|\/)(research|qa|evidence|originals|private|src|source|node_modules|\.git|\.wrangler)(\/|$)|(^|\/)(project|STATE|research|assets|design|routes|flows|implementation|qa|review|publication|tracker|sealed-build|public-verification)\.json$|(^|\/)(README|HANDOFF|AGENTS)\.md$|(^|\/)\.env|\.(mjs|ts|tsx|map|log|pem|key|csv|xlsx)$/i;
 for(const f of b.allowlist){await safePath(out,f);requireTrue(!banned.test(f)&&(!f.endsWith('.json')||f==='deployment.json'),`Private/source file in public output: ${f}`);}
 for(const f of b.configOnly)requireTrue(b.allowlist.includes(f)&&['_headers','_redirects'].includes(f),`Unsupported config-only file: ${f}`);
 requireTrue(b.allowlist.includes('404.html')&&b.allowlist.includes('deployment.json')&&b.allowlist.includes('robots.txt'),'Custom404, robots policy or deployment marker missing');
 requireTrue(/^\s*Disallow:\s*\/\s*$/im.test(await readFile(resolve(out,'robots.txt'),'utf8')),'Preview robots exclusion missing');
 const marker=await json(resolve(out,'deployment.json'));requireTrue(marker.projectId===p.projectId&&marker.buildStamp===b.buildStamp,'Build marker identity mismatch');
 for(const x of routes.pages)await routeFile(out,x.path);for(const f of b.flowTestFiles)await safePath(root,f);
 passed.push('build');if(stop===3)return {passed};
 const fp=await fingerprint(root),q=await packet(root,'qa');requireTrue(q.fingerprint===fp,'Stale qa.json');await technical(root,q.technical,fp,'local',routes);unique(q.flows.map(x=>x.id),'QA flow IDs');
 for(const f of flows.entries){const test=q.flows.find(x=>x.id===f.id);requireTrue(test?.passed===true,`Untested/failed flow: ${f.id}`);await evidence(root,test.evidence);}
 for(const x of q.defects){if(['critical','high'].includes(x.severity))requireTrue(x.status==='resolved',`Release blocker: ${x.id}`);if(x.status!=='resolved')requireTrue(x.disposition.trim().length>=12,`No defect disposition: ${x.id}`);}
 passed.push('qa');if(stop===4)return {passed,fingerprint:fp};
 const v=await packet(root,'review');requireTrue(v.fingerprint===fp,'Stale independent review');requireTrue(v.reviewedBy===p.reviewer&&v.reviewedBy!==p.builder,'Independent reviewer mismatch');unique(v.coverage.map(x=>x.path),'review coverage');const localReport=await json(await evidence(root,q.technical));for(const x of routes.pages){const c=v.coverage.find(c=>c.path===x.path);requireTrue(!!c,`Route not visually reviewed: ${x.path}`);for(const [key,width]of [['mobile',390],['desktop',1440]]){await evidence(root,c[key]);const shot=localReport.cases.find(r=>r.path===x.path&&r.width===width)?.screenshot;requireTrue(shot?.sha256===c[key].sha256&&shot?.path===c[key].path,`Review references wrong route/viewport screenshot: ${x.path} ${key}`);}}
 requireTrue(Object.values(v.scores).every(n=>n>=4)&&Object.values(v.scores).reduce((s,n)=>s+n,0)>=26,'Design review score below bar');
 passed.push('review');if(stop===5)return {passed,fingerprint:fp};
 requireTrue(p.permissions.publish.granted,'Publication not authorized');const seal=await json(resolve(root,'sealed-build.json'));requireTrue(seal.fingerprint===fp,'Build seal is stale');for(const f of seal.files)requireTrue(hash(await readFile(await safePath(out,f.path)))===f.sha256,`Sealed file changed: ${f.path}`);requireTrue(JSON.stringify(seal.files.map(x=>x.path).sort())===JSON.stringify([...b.allowlist].sort()),'Seal file set mismatch');
 const pub=await packet(root,'publication');requireTrue(pub.status==='success','Provider publication is not successful');requireTrue(webUrl(pub.stableUrl)&&webUrl(pub.immutableUrl)&&new URL(pub.stableUrl).protocol==='https:'&&new URL(pub.immutableUrl).protocol==='https:'&&new URL(pub.stableUrl).origin!==new URL(pub.immutableUrl).origin,'Distinct HTTPS provider verified URLs required');requireTrue(pub.buildStamp===b.buildStamp&&timestamp(pub.deployedAt),'Publication stamp/date mismatch');await evidence(root,pub.receipt);
 const hosted=await technical(root,pub.hostedQa,fp,'hosted',routes);requireTrue(new URL(hosted.baseUrl).origin===new URL(pub.stableUrl).origin,'Hosted QA targets wrong preview');
 const verification=await json(await evidence(root,pub.publicVerification));requireTrue(verification.fingerprint===fp&&verification.passed===true&&verification.stableUrl===pub.stableUrl&&verification.immutableUrl===pub.immutableUrl,'Public verification missing/stale/wrong deployment');
 passed.push('publish');if(stop===6)return {passed,fingerprint:fp};
 requireTrue(p.permissions.tracker.granted,'Tracker mutation not authorized');const t=await packet(root,'tracker');requireTrue(t.projectId===p.projectId&&t.applied&&t.preservationVerified&&t.tableCoverageVerified,'Tracker application/preservation/readback incomplete');for(const ref of [t.writePlan,t.before,t.after])await evidence(root,ref);
 passed.push('register');return {passed,fingerprint:fp};
}
export async function validateBatch(path){
 const batch=await json(path),batchSchema=await json(resolve(kit,'schemas/batch.schema.json')),v=ajv.compile(batchSchema);requireTrue(v(batch),ajv.errorsText(v.errors));unique(batch.jobs.map(x=>x.projectId),'batch lead IDs');unique(batch.jobs.map(x=>resolve(dirname(path),x.projectDir).toLowerCase()),'batch folders');
 const signatures=new Map();for(const j of batch.jobs){const root=resolve(dirname(path),j.projectDir);for(const other of batch.jobs){if(other===j)continue;const otherRoot=resolve(dirname(path),other.projectDir);requireTrue(!within(root,otherRoot),'Overlapping worker folders');}try{const p=await packet(root,'project');requireTrue(p.projectId===j.projectId&&p.instructionCommit===batch.instructionCommit&&p.scope===j.scope,'Assignment/pin mismatch');const proposed=await json(resolve(root,'design.json'));if(!proposed.conceptReviewedBy)continue;const d=await packet(root,'design');const s=d.layoutSignature.toLowerCase().replace(/\s+/g,' ').trim();requireTrue(!signatures.has(s),`Repeated batch design signature: ${j.projectId}`);signatures.set(s,j.projectId);}catch(e){if(e.code!=='ENOENT')throw e;}}
 return {batchId:batch.batchId,jobs:batch.jobs.length,existingDesigns:signatures.size};
}
