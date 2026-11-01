import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {fixture,server} from './fixture.mjs';
import {browserQa} from '../lib/browser-qa.mjs';
import {validateGate,fingerprint,VIEWPORTS} from '../lib/gates.mjs';
import {seal,verifyPublic} from '../lib/release.mjs';
import {json,putJson,reference} from '../lib/files.mjs';

test('real browser QA, independent review and byte verification reject regressions', {timeout:180000},async t=>{
 const root=await fixture(),s=await server(root);t.after(s.close);
 // An existing error-document file is a public asset; an unknown request is the error.
 assert.equal((await fetch(new URL('/404.html',s.base))).status,200);
 assert.equal((await fetch(new URL('/missing-fixture-route',s.base))).status,404);
 const result=await browserQa(root,s.base,'local');assert.equal(result.cases,2*VIEWPORTS.length);
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 try{const page=await browser.newPage();await page.goto(s.base);assert.equal(await page.locator('#status').isVisible(),false);await page.getByRole('button',{name:'Show local status'}).click();assert.equal(await page.locator('#status').innerText(),'Fixture action complete');assert.equal(await page.locator('#status').isVisible(),true);}finally{await browser.close();}
 await writeFile(resolve(root,'evidence/flow-result.txt'),'Actual Playwright assertion: local button exposed the expected visible status.\n');
 const qa=await json(resolve(root,'qa.json'));qa.flows=[{id:'local-message',passed:true,evidence:await reference(root,'evidence/flow-result.txt')}];await putJson(resolve(root,'qa.json'),qa);await validateGate(root,'qa');
 const technical=await json(resolve(root,'evidence/technical-local.json')),review=await json(resolve(root,'review.json'));
 review.fingerprint=await fingerprint(root);review.reviewedBy='fixture-root';review.coverage=['/','/services'].map(path=>({path,mobile:technical.cases.find(c=>c.path===path&&c.width===390).screenshot,desktop:technical.cases.find(c=>c.path===path&&c.width===1440).screenshot,observation:'Synthetic test coverage only; these scores are fixtures, not a claim of real visual inspection.'}));review.scores={specificity:5,artDirection:5,copyContent:4,mobile:4,journeys:4,finishAccessibility:4};review.comparison='Synthetic fixture adds a distinct service route and retains its fictional telephone link.';review.observations='Automated fixture for review contract behavior; no real premium design is approved.';await putJson(resolve(root,'review.json'),review);await validateGate(root,'review');await seal(root);
 const oldFetch=globalThis.fetch;const stable='https://stable.example.test/',immutable='https://immutable.example.test/';
 const errorAsset404=await server(root,{direct404Status:404});t.after(errorAsset404.close);
 for(const [host,directStatus] of [[s,200],[errorAsset404,404]]){
  assert.equal((await oldFetch(new URL('/404.html',host.base))).status,directStatus);
  assert.equal((await oldFetch(new URL('/missing-fixture-route',host.base))).status,404);
  assert.equal((await oldFetch(new URL('/project.json',host.base))).status,404);
  globalThis.fetch=(url,options)=>oldFetch(new URL(new URL(url).pathname,host.base),options);
  try{
   const r=await verifyPublic(root,stable,immutable);assert.equal(r.passed,true);
   const verified=await json(resolve(root,'public-verification.json'));
   const errorAssets=verified.checks.filter(c=>new URL(c.url).pathname==='/404.html');
   assert.equal(errorAssets.length,2);assert.ok(errorAssets.every(c=>c.status===directStatus));
   t.diagnostic(`Direct error asset HTTP${directStatus} accepted on both origins; missing/private URLs remain HTTP404.`);
  }finally{globalThis.fetch=oldFetch;}
 }
 // Synthetic provider/hosted records exercise the gate contract only, not a real deployment.
 await putJson(resolve(root,'evidence/provider-receipt.json'),{fixture:true,deploymentId:'synthetic-test-receipt'});
 await putJson(resolve(root,'evidence/technical-hosted-fixture.json'),{...technical,mode:'hosted',baseUrl:stable});
 const pub=await json(resolve(root,'publication.json'));Object.assign(pub,{projectName:'fictional-test-only',deploymentId:'synthetic-test-receipt',status:'success',deployedAt:'2026-10-31T00:00:00Z',buildStamp:'fixture-v1',stableUrl:stable,immutableUrl:immutable,receipt:await reference(root,'evidence/provider-receipt.json'),hostedQa:await reference(root,'evidence/technical-hosted-fixture.json')});await putJson(resolve(root,'publication.json'),pub);await validateGate(root,'publish');
 const project=await json(resolve(root,'project.json'));project.permissions.publish.granted=false;await putJson(resolve(root,'project.json'),project);await assert.rejects(validateGate(root,'publish'),/Publication not authorized/);project.permissions.publish.granted=true;await putJson(resolve(root,'project.json'),project);
 await assert.rejects(validateGate(root,'register'));
 for(const name of ['write-plan','before','after'])await putJson(resolve(root,`evidence/${name}.json`),{fixture:true,purpose:name});
 const tracker=await json(resolve(root,'tracker.json'));Object.assign(tracker,{applied:true,writePlan:await reference(root,'evidence/write-plan.json'),before:await reference(root,'evidence/before.json'),after:await reference(root,'evidence/after.json'),preservationVerified:true,verifiedCells:['Synthetic fixture source register row'],tableCoverageVerified:true});await putJson(resolve(root,'tracker.json'),tracker);assert.equal((await validateGate(root,'register')).passed.at(-1),'register');
 const leaky=await server(root,{leak:true});t.after(leaky.close);globalThis.fetch=(url,options)=>oldFetch(new URL(new URL(url).pathname,leaky.base),options);
 try{await assert.rejects(verifyPublic(root,stable,immutable),/publication checks failed/);}finally{globalThis.fetch=oldFetch;}
 review.reviewedBy='fixture-builder';await putJson(resolve(root,'review.json'),review);await assert.rejects(validateGate(root,'review'),/reviewer mismatch/);review.reviewedBy='fixture-root';await putJson(resolve(root,'review.json'),review);
 const code=await readFile(resolve(root,'site/dist/index.html'),'utf8');await writeFile(resolve(root,'site/dist/index.html'),code.replace('Fictional Workshop','Changed Workshop'));await assert.rejects(validateGate(root,'qa'),/Stale/);
});
