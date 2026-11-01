import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {writeFile,readdir,mkdtemp,mkdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fixture} from './fixture.mjs';
import {json,putJson,reference} from '../lib/files.mjs';
import {retrospect,learningCandidate,lessons} from '../lib/learning.mjs';
import {packet,validateGate} from '../lib/gates.mjs';
import {run} from '../bin/icm.mjs';

async function learned(){const root=await fixture();await retrospect(root,'blocked');await writeFile(resolve(root,'before.txt'),'Fictional regression reproduced the incorrect coverage decision.');await writeFile(resolve(root,'after.txt'),'Fictional regression now rejects the incorrect coverage decision.');const before=await reference(root,'before.txt'),after=await reference(root,'after.txt'),l=await json(resolve(root,'learning.json'));l.observations=[{id:'root-rework',stage:'design',finding:'Synthetic fixture: known blocked routes were omitted from the baseline.',evidence:before}];l.actions=[{id:'synthetic-coverage-lesson',stage:'design',hypothesis:'Counting all known core routes should prevent omitted blocked content.',change:'Add a regression for blocked core coverage and clarify the baseline rule.',publicSummary:'Known core routes remain in the baseline even when a source fetch is blocked.',before,after,regressionFiles:['test/gates.test.mjs'],decision:'hold',reviewedBy:'fixture-root',privacyReviewed:false,promotionCommit:''}];l.nextRunChecklist=['Verify all known core routes are mapped before accepting the plan.'];await putJson(resolve(root,'learning.json'),l);return {root,l};}
test('retrospective draft has no invented metrics or automatic approval',async()=>{const root=await fixture();await retrospect(root,'failed');const l=await json(resolve(root,'learning.json'));assert.equal(l.metrics.routeCases,null);assert.equal(l.actions.length,0);await assert.rejects(validateGate(root,'learn'));});
test('a blocked delivery can pass learning without being marked delivered',async()=>{const {root}=await learned();const state=await json(resolve(root,'STATE.json'));state.currentStage='design';await putJson(resolve(root,'STATE.json'),state);assert.equal((await validateGate(root,'learn')).outcome,'blocked');await run(['advance',root,'learn']);const after=await json(resolve(root,'STATE.json'));assert.equal(after.currentStage,'design');assert.equal(after.learningStatus,'reviewed');});
test('each retrospective archives the prior run instead of erasing learning',async()=>{const {root,l}=await learned();await retrospect(root,'interrupted');const history=await readdir(resolve(root,'evidence/learning-history'));assert.ok(history.includes(l.runId+'.json'));assert.notEqual((await json(resolve(root,'learning.json'))).runId,l.runId);});
test('adoption requires independently reviewed distinct evidence and promotion proof',async()=>{const {root,l}=await learned();l.actions[0].decision='adopt';await putJson(resolve(root,'learning.json'),l);await assert.rejects(validateGate(root,'learn'),/Adoption requires/);l.actions[0].privacyReviewed=true;l.actions[0].promotionCommit='a'.repeat(40);l.actions[0].after=l.actions[0].before;await putJson(resolve(root,'learning.json'),l);await assert.rejects(validateGate(root,'learn'),/distinct before\/after/);});
test('candidate export rejects business contact data',async()=>{const {root,l}=await learned();Object.assign(l.actions[0],{decision:'adopt',privacyReviewed:true,promotionCommit:'a'.repeat(40),publicSummary:'Do not publish this fictional private contact fixture@example.test.'});await putJson(resolve(root,'learning.json'),l);await assert.rejects(learningCandidate(root,l.actions[0].id,packet),/contact, URL/);});
test('a fabricated promotion SHA cannot pass as recursive improvement',async()=>{const {root,l}=await learned();Object.assign(l.actions[0],{decision:'adopt',privacyReviewed:true,promotionCommit:'f'.repeat(40)});await putJson(resolve(root,'learning.json'),l);await assert.rejects(validateGate(root,'learn'),/Promotion commit must exist/);});
test('adopted lessons are routed by stage for the next run',async()=>{const all=await lessons(),design=await lessons('design');assert.ok(all.length>=5);assert.ok(design.length>=2);assert.ok(design.every(x=>x.stage==='design'&&x.status==='adopted'));});

test('npm installations can verify promotions in an explicit source clone without writing into the package',async()=>{
 const exec=promisify(execFile),maintainer=await mkdtemp(resolve(tmpdir(),'icm-maintainer-'));
 await exec('git',['init'],{cwd:maintainer});await exec('git',['remote','add','origin','https://github.com/ksksrbiz-arch/proposal-ICM.git'],{cwd:maintainer});
 await writeFile(resolve(maintainer,'package.json'),JSON.stringify({name:'proposal-icm'}));await mkdir(resolve(maintainer,'test'));await writeFile(resolve(maintainer,'test/gates.test.mjs'),'// Fictional promotion regression\n');
 await exec('git',['add','.'],{cwd:maintainer});await exec('git',['-c','user.name=Fixture Reviewer','-c','user.email=fixture@example.test','commit','-m','Synthetic promotion proof'],{cwd:maintainer});
 const sha=(await exec('git',['rev-parse','HEAD'],{cwd:maintainer})).stdout.trim(),{root,l}=await learned();
 Object.assign(l.actions[0],{decision:'adopt',privacyReviewed:true,promotionCommit:sha});await putJson(resolve(root,'learning.json'),l);
 const old=process.env.ICM_MAINTAINER_REPO;process.env.ICM_MAINTAINER_REPO=maintainer;
 try{
  assert.equal((await validateGate(root,'learn')).adopted,1);
  const result=await learningCandidate(root,l.actions[0].id,packet);assert.ok(result.path.startsWith(maintainer));assert.match(await readFile(result.path,'utf8'),/Sanitized|Known core routes/);
  await assert.rejects(learningCandidate(root,l.actions[0].id,packet),/EEXIST/);
  await exec('git',['remote','set-url','origin','https://github.com/example/unrelated.git'],{cwd:maintainer});
  await assert.rejects(validateGate(root,'learn'),/Proposal ICM source clone/);
 }finally{if(old===undefined)delete process.env.ICM_MAINTAINER_REPO;else process.env.ICM_MAINTAINER_REPO=old;}
});
