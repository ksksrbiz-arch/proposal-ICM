import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {json,putJson,evidence,safePath} from './files.mjs';
const kit=fileURLToPath(new URL('../',import.meta.url));
const outcomes=['completed','blocked','failed','interrupted'];
const exec=promisify(execFile);
export async function retrospect(root,outcome,currentFingerprintFn){
 if(!outcomes.includes(outcome))throw Error('Outcome must be completed|blocked|failed|interrupted');
 const project=await json(resolve(root,'project.json'));const runId=`run-${Date.now()}-${randomUUID().slice(0,8)}`;
 try{const old=await json(resolve(root,'learning.json'));if(!/^[a-zA-Z0-9-]+$/.test(old.runId))throw Error('Unsafe prior learning run ID');await putJson(await safePath(root,`evidence/learning-history/${old.runId}.json`,{mustExist:false}),old);}catch(e){if(e.code!=='ENOENT')throw e;}
 const metrics={routeCases:null,flowPasses:null,openDefects:null,reviewScore:null,reworkIterations:null};const observations=[];
 let currentFingerprint=null;try{if(currentFingerprintFn)currentFingerprint=await currentFingerprintFn(root);}catch{}
 try{const qa=await json(resolve(root,'qa.json'));const report=await json(await evidence(root,qa.technical));const fresh=!!currentFingerprint&&qa.fingerprint===currentFingerprint&&report.fingerprint===currentFingerprint;if(fresh){metrics.routeCases=report.cases?.length??null;metrics.flowPasses=qa.flows.filter(x=>x.passed).length;metrics.openDefects=qa.defects.filter(x=>x.status!=='resolved').length;}observations.push({id:'measured-technical-outcome',stage:'qa',finding:`The saved technical report contains ${report.cases?.length??0} cases and ${report.failures?.length??0} failures. Its fingerprint is ${fresh?'current':'not confirmed current; metrics remain unknown'}.`,evidence:qa.technical});}catch{}
 try{const review=await json(resolve(root,'review.json'));if(currentFingerprint&&review.fingerprint===currentFingerprint&&review.coverage.length)metrics.reviewScore=Object.values(review.scores).reduce((s,n)=>s+n,0);}catch{}
 const record={schemaVersion:1,projectId:project.projectId,runId,recordedAt:new Date().toISOString(),architectureUsed:project.instructionCommit||'unrecorded',outcome,reviewer:project.reviewer||'',metrics,observations,actions:[],nextRunChecklist:[]};await putJson(resolve(root,'learning.json'),record);return {runId,path:'learning.json',status:'Draft retrospective created; agent critique, independent review and evidence are required.'};
}
export async function validateLearning(root,packet){
 const l=await packet(root,'learning'),p=await json(resolve(root,'project.json'));
 if(l.projectId!==p.projectId)throw Error('Learning project identity mismatch');
 if(l.reviewer!==p.reviewer||l.reviewer===p.builder)throw Error('Learning needs the independent root reviewer');
 if(new Set(l.actions.map(a=>a.id)).size!==l.actions.length)throw Error('Duplicate learning action IDs');
 for(const o of l.observations)await evidence(root,o.evidence);
 for(const a of l.actions){
  await evidence(root,a.before);await evidence(root,a.after);
  if(a.reviewedBy!==l.reviewer)throw Error('Learning action lacks independent review');
  if(a.decision==='adopt'){
   if(!a.privacyReviewed||!a.regressionFiles.length||!a.promotionCommit)throw Error('Adoption requires privacy review, regression evidence and an actual promotion commit');
   if(a.before.sha256===a.after.sha256)throw Error('Adoption needs distinct before/after evidence');
   try{await exec('git',['merge-base','--is-ancestor',a.promotionCommit,'HEAD'],{cwd:kit});const result=await exec('git',['show','--format=','--name-only',a.promotionCommit],{cwd:kit});const changed=new Set(result.stdout.trim().split(/\r?\n/));for(const path of a.regressionFiles){await safePath(kit,path);if(!changed.has(path))throw Error('Regression file absent from promotion commit');}}catch{throw Error('Promotion commit must exist in this kit history and change the referenced regression files');}
  }
 }
 return {passed:['learn'],runId:l.runId,outcome:l.outcome,adopted:l.actions.filter(a=>a.decision==='adopt').length,retained:l.actions.filter(a=>a.decision==='retain').length,held:l.actions.filter(a=>a.decision==='hold').length};
}
export async function lessons(stage){const registry=await json(resolve(kit,'.icm/learning/LESSONS.json'));return registry.lessons.filter(x=>x.status==='adopted'&&(!stage||x.stage===stage));}
export async function learningCandidate(root,id,packet){
 const l=await packet(root,'learning'),p=await json(resolve(root,'project.json')),a=l.actions.find(x=>x.id===id);if(!a)throw Error('Learning action not found');
 if(a.decision!=='adopt'||!a.privacyReviewed)throw Error('Only reviewed adopted lessons can become public candidates');
 if(/@|https?:\/\/|[A-Za-z]:[\\/]|\b\d[\d\s().-]{7,}\d\b/.test(a.publicSummary)||a.publicSummary.toLowerCase().includes(p.projectId.toLowerCase()))throw Error('Public lesson contains contact, URL, local-path or prospect-specific data');
 await validateLearning(root,packet);
 for(const path of a.regressionFiles)await safePath(kit,path);
 const dir=resolve(kit,'.icm/learning/candidates');await mkdir(dir,{recursive:true});const path=resolve(dir,id+'.md');
 // Exclusive write: never overwrite a previously reviewed lesson silently.
 await writeFile(path,`# ${id}\n\nOwning stage: ${a.stage}\n\n${a.publicSummary}\n\nRegression references: ${a.regressionFiles.join(', ')}\n\nPromotion commit: ${a.promotionCommit}\n\nRoot must confirm the actual patch/tests and integrate the generic rule into LESSONS.json and the owning stage. This candidate is not active policy by itself.\n`,{flag:'wx'});
 return {path,status:'Sanitized candidate only; root must integrate and verify the actual policy/test change.'};
}
