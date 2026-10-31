// Fictional infrastructure fixture. Not a prospect, visual template or real review.
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import http from 'node:http';
import {templates} from '../lib/templates.mjs';
import {putJson,json,hash,reference} from '../lib/files.mjs';
export async function fixture(){
 const root=await mkdtemp(resolve(tmpdir(),'proposal-icm-'));const t=templates('TEST-001');const grant={granted:true,instruction:'Fixture only: explicitly authorize this synthetic test action.',at:'2026-10-31T00:00:00Z'};
 Object.assign(t['project.json'],{business:{name:'Fictional Fixture Workshop',locality:'Example, WA'},instructionCommit:'a'.repeat(40),assignment:'Synthetic test fixture for gate behavior, never a business proposal.',scope:'redesign',builder:'fixture-builder',reviewer:'fixture-root',permissions:{build:grant,publish:grant,tracker:grant,outreach:{granted:false,instruction:'',at:''}}});
 t['research.json']={schemaVersion:1,identity:{matched:true,reason:'Synthetic fixture identity, not a real company.',sourceIds:['official']},sources:[{id:'official',url:'https://business.example.test/',checkedAt:'2026-10-31T00:00:00Z',notes:'Fictional source for automated infrastructure tests only.'}],facts:[{id:'service',statement:'The fictional workshop fixture offers a service.',status:'KNOWN',sourceIds:['official'],publicUse:true,qualification:''}],baseline:{status:'known',pages:[{id:'old-home',url:'https://business.example.test/',title:'Home',purpose:'Introduce a fictional test workshop.',type:'core',accessible:true}],checkedUrls:['https://business.example.test/'],limitations:'Synthetic baseline, never a current company audit.'},differentiators:['The fixture has deterministic authored test content.','A real button exposes a locally rendered message.'],primaryJourney:'Read the fictional service and use its local test button.',launchUnknowns:['No real business is represented by this fixture.']};
 t['assets.json']={schemaVersion:1,strategy:'No business photos: this is a text-only infrastructure fixture.',entries:[]};
 t['design.json']={schemaVersion:1,concept:'A plain fictional workshop test fixture.',rationale:'Exercise infrastructure, not demonstrate visual quality.',layoutSignature:'fictional test workshop header and simple reading area',typography:'System serif title and readable system sans body.',palette:['#102b3f','#ffffff'],mobileStrategy:'Read one column with clearly sized button controls.',distinctions:['The title identifies a fictional workshop.','Different routes have distinct meaningful test copy.','The local button exposes a visible test outcome.'],copy:{headline:'Fictional workshop',body:'A synthetic page for testing the ICM infrastructure.',primaryCta:'Call the fictional number'},comparison:'Adds one fictional service route while preserving the synthetic homepage.',conceptReviewedBy:'fixture-root'};
 const action={label:'Call the fictional number',kind:'phone',target:'tel:+12025550123'};
 t['routes.json']={schemaVersion:1,pages:[{path:'/',title:'Fictional Workshop',type:'core',purpose:'Introduce the fictional workshop and its primary test action.',sections:['A workshop introduction for this synthetic fixture.','A local action with a visible confirmation state.'],sourceIds:['official'],assetIds:[],baselineIds:['old-home'],primaryAction:action},{path:'/services',title:'Fixture Services',type:'core',purpose:'Explain a distinct fictional service for route coverage.',sections:['A distinct service explanation, specific to this test.','Call preparation and a direct fictional telephone link.'],sourceIds:['official'],assetIds:[],baselineIds:[],primaryAction:action}]};
 t['flows.json']={schemaVersion:1,entries:[{id:'local-message',entry:'/',description:'Press the fixture button and see its local message.',outcome:'A visible status changes to Fixture action complete.',destination:'local-status',behavior:'local-only'}]};
 t['implementation.json']={schemaVersion:1,sourceDir:'site',buildCommand:'Fixture files are authored directly for testing only.',buildStamp:'fixture-v1',allowlist:['index.html','services.html','404.html','deployment.json','robots.txt','_headers'],configOnly:['_headers'],flowTestFiles:['site/tests/flow.mjs']};
 for(const [path,value]of Object.entries(t))await putJson(resolve(root,path),value);
 await mkdir(resolve(root,'site/dist'),{recursive:true});await mkdir(resolve(root,'site/tests'),{recursive:true});await writeFile(resolve(root,'site/tests/flow.mjs'),'// Fixture-specific test contract: click local-action and assert visible status.\n');
 const html=(title,body)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title><style>body{font:18px system-ui;margin:20px;max-width:900px}a,button{display:inline-block;padding:14px}button{font:inherit}main{min-height:240px}</style></head><body><header><a href="/">Home</a><a href="/services">Services</a></header><main><h1>${title}</h1><p>${body}</p><a href="tel:+12025550123">Call the fictional number</a><button id="local-action" onclick="document.getElementById('status').hidden=false">Show local status</button><p id="status" role="status" hidden>Fixture action complete</p></main><footer>Independent website proposal — fictional test fixture.</footer></body></html>`;
 await writeFile(resolve(root,'site/dist/index.html'),html('Fictional Workshop','This fictional workshop introduces the test service and a local interaction.'));
 await writeFile(resolve(root,'site/dist/services.html'),html('Fixture Services','This separate fictional service route has different substantive content for the route scanner.'));
 await writeFile(resolve(root,'site/dist/404.html'),html('Page not found','This is the fictional fixture custom error page.'));
 await putJson(resolve(root,'site/dist/deployment.json'),{projectId:'TEST-001',buildStamp:'fixture-v1'});await writeFile(resolve(root,'site/dist/robots.txt'),'User-agent: *\nDisallow: /\n');await writeFile(resolve(root,'site/dist/_headers'),'/*\n  X-Robots-Tag: noindex, nofollow\n');
 return root;
}
export async function server(root,{leak=false}={}){
 const out=resolve(root,'site/dist');const s=http.createServer(async(req,res)=>{
  let path=new URL(req.url,'http://local').pathname;let status=200;
  let file=path==='/'?'index.html':path==='/services'?'services.html':path.slice(1);
  if(file==='_headers')file='not-real';
  if(file.includes('..')||!['index.html','services.html','404.html','deployment.json','robots.txt'].includes(file)){file=leak?'index.html':'404.html';status=leak?200:404;}
  if(file==='404.html')status=404;
  const bytes=await readFile(resolve(out,file));res.writeHead(status,{'content-type':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'text/plain','x-robots-tag':'noindex, nofollow'}).end(bytes);
 });await new Promise(r=>s.listen(0,'127.0.0.1',r));return {base:`http://127.0.0.1:${s.address().port}/`,close:()=>new Promise(r=>s.close(r))};
}
