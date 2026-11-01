#!/usr/bin/env node
import {mkdir,readdir,writeFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {json,putJson,within} from '../lib/files.mjs';
import {templates} from '../lib/templates.mjs';
import {STAGES,validateGate,fingerprint,validateBatch,packet} from '../lib/gates.mjs';
import {retrospect,lessons,learningCandidate} from '../lib/learning.mjs';
import {browserQa} from '../lib/browser-qa.mjs';
import {seal,verifyPublic} from '../lib/release.mjs';
const kit=fileURLToPath(new URL('../',import.meta.url));
const help=`Proposal ICM\n\ninit <privateDir>\nstatus <privateDir>\nfingerprint <privateDir>\ngate <privateDir> <${STAGES.join('|')}>\nadvance <privateDir> <stage>\nbrowser-qa <privateDir> <baseUrl> <local|hosted>\nseal <privateDir>\nverify-public <privateDir> <stableUrl> <immutableUrl>\nbatch <manifest.json>\nlessons [stage]\nretrospect <privateDir> <completed|blocked|failed|interrupted>\nlearning-candidate <privateDir> <lesson-id>\n\nNo command deploys, changes a spreadsheet or sends outreach. See docs/commands.md.`;
export async function run(args){const [command,dir,...rest]=args;if(!command||command==='help')return help;if(command==='lessons')return lessons(dir);if(!dir)throw Error('Missing project/manifest path');const root=resolve(dir);
 if(command==='init'){
  if(within(kit,root)&&!within(resolve(kit,'work'),root))throw Error('Real projects must be outside the public kit or under ignored work/');
  try{if((await readdir(root)).length)throw Error('Refusing nonempty project folder');}catch(e){if(e.code!=='ENOENT')throw e;}
  await mkdir(root,{recursive:true});for(const [name,value]of Object.entries(templates(basename(root))))await putJson(resolve(root,name),value);
  await writeFile(resolve(root,'HANDOFF.md'),'# New proposal assignment\n\nFill the verified brief and authority before building. Read the pinned ICM AGENTS.md and current stage. No release evidence exists yet.\n');return {project:root,stage:'brief',authority:'none; actual user instruction required'};
 }
 if(command==='batch')return validateBatch(root);
 if(command==='status'){const state=await json(resolve(root,'STATE.json')),project=await json(resolve(root,'project.json'));let fp;try{fp=await fingerprint(root);}catch{}return {projectId:project.projectId,state,fingerprint:fp??'not built/inputs incomplete'};}
 if(command==='fingerprint')return fingerprint(root);
 if(command==='gate'||command==='advance'){const stage=rest[0],result=await validateGate(root,stage);if(command==='advance'){const state=await json(resolve(root,'STATE.json'));state.completed=[...new Set([...state.completed,...result.passed])];if(stage==='learn'){state.learningStatus='reviewed';state.lastLearningRunId=result.runId;if(state.currentStage==='learn'&&result.outcome==='completed')state.currentStage='complete';}else state.currentStage=STAGES[STAGES.indexOf(stage)+1]??'complete';state.events.push({at:new Date().toISOString(),completedThrough:stage,fingerprint:result.fingerprint??null});await putJson(resolve(root,'STATE.json'),state);}return result;}
 if(command==='browser-qa')return browserQa(root,rest[0],rest[1]);
 if(command==='seal')return seal(root);
 if(command==='verify-public')return verifyPublic(root,rest[0],rest[1]);
 if(command==='retrospect')return retrospect(root,rest[0],fingerprint);
 if(command==='learning-candidate')return learningCandidate(root,rest[0],packet);
 throw Error('Unknown command; run help');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{const result=await run(process.argv.slice(2));console.log(typeof result==='string'?result:JSON.stringify(result,null,2));}catch(e){console.error('ICM BLOCKED: '+e.message);process.exitCode=1;}}
