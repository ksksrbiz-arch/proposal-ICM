import {chromium} from 'playwright';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {packet,fingerprint,validateGate,VIEWPORTS} from './gates.mjs';
import {putJson,json,reference,hash,webUrl} from './files.mjs';
export async function browserQa(root,baseUrl,mode){
 if(!['local','hosted'].includes(mode)||!webUrl(baseUrl))throw Error('Expected HTTP(S) base URL and local|hosted');
 await validateGate(root,'build');root=resolve(root);const base=new URL(baseUrl);if(base.pathname!=='/'||base.search||base.hash)throw Error('QA base must be the origin URL');
 const plan=await packet(root,'routes'),fp=await fingerprint(root),out=resolve(root,'evidence/screenshots',mode);await mkdir(out,{recursive:true});
 const launch=process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{};
 const browser=await chromium.launch({headless:true,...launch});const cases=[],failures=[],warnings=[],links=new Map(),contents=new Map(),titles=new Map();
 try{for(const viewport of VIEWPORTS){const context=await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:viewport.width<=768});const page=await context.newPage();
  for(let i=0;i<plan.pages.length;i++){
   const route=plan.pages[i],errors=[],resourceErrors=[];const onError=e=>errors.push(e.message),onResponse=r=>{if(r.url().startsWith(base.origin)&&r.status()>=400)resourceErrors.push({url:r.url(),status:r.status()});},onRequestFailed=r=>{if(r.url().startsWith(base.origin))resourceErrors.push({url:r.url(),error:r.failure()?.errorText});};page.on('pageerror',onError);page.on('response',onResponse);page.on('requestfailed',onRequestFailed);
   try{
    const response=await page.goto(new URL(route.path,base).href,{waitUntil:'networkidle',timeout:30000});
    await page.evaluate(async()=>{await document.fonts.ready;for(const im of document.images)im.loading='eager';await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));});
    const state=await page.evaluate(()=>{
     const ids=[...document.querySelectorAll('[id]')].map(e=>e.id),main=document.querySelector('main');
     return {title:document.title,h1:document.querySelectorAll('h1').length,mainText:main?.innerText??'',text:document.body.innerText,robots:document.querySelector('meta[name="robots"]')?.content??'',overflow:document.documentElement.scrollWidth>innerWidth+1,duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),brokenImages:[...document.images].filter(im=>!!im.getAttribute('src')&&!im.naturalWidth).map(im=>im.src),links:[...document.querySelectorAll('a[href]')].map(a=>({href:a.href,text:a.innerText.trim()})),actions:[...document.querySelectorAll('a,button,input,select,textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height;}).filter(e=>{const r=e.getBoundingClientRect();return r.width<24||r.height<24;}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,80))};
    });
    const problems=[];if(response?.status()!==200)problems.push('HTTP '+response?.status());if(state.h1!==1)problems.push('Expected one H1');if(!state.title)problems.push('Missing title');if(!/noindex/i.test(state.robots))problems.push('Missing noindex meta');if(!/independent.{0,30}(proposal|concept)|website proposal|proposed (website|redesign)/i.test(state.text))problems.push('Missing independent proposal disclosure');if(state.overflow)problems.push('Horizontal overflow');if(state.duplicateIds.length)problems.push('Duplicate IDs');if(state.brokenImages.length)problems.push('Broken images');if(errors.length)problems.push('JavaScript errors');if(resourceErrors.length)problems.push('Failed same-origin resources');
    if(!state.mainText.trim())problems.push('Missing semantic main content');
    if(!state.links.some(l=>l.href===new URL(route.primaryAction.target,new URL(route.path,base)).href)&&route.primaryAction.kind!=='local')problems.push('Planned primary action absent');
    if(viewport.width===1440){const mainHash=hash(state.mainText.replace(/\s+/g,' ').trim());if(contents.has(mainHash))problems.push('Duplicate main content with '+contents.get(mainHash));contents.set(mainHash,route.path);if(titles.has(state.title))problems.push('Duplicate page title with '+titles.get(state.title));titles.set(state.title,route.path);for(const l of state.links){try{const u=new URL(l.href);if(u.origin===base.origin&&['http:','https:'].includes(u.protocol))links.set(u.href,route.path);}catch{problems.push('Invalid link');}}}
    if(state.actions.length)warnings.push({path:route.path,viewport,kind:'targets-under-24px-review',controls:state.actions});
    const screenshot=resolve(out,`${String(i).padStart(3,'0')}-${viewport.width}x${viewport.height}.png`);await page.screenshot({path:screenshot,fullPage:true});const ref=await reference(root,relative(root,screenshot).split(sep).join('/'));
    const c={path:route.path,...viewport,passed:problems.length===0,screenshot:ref,problems,errors,resourceErrors};cases.push(c);if(problems.length)failures.push(c);
   }catch(e){failures.push({path:route.path,...viewport,error:e.message});}
   finally{page.off('pageerror',onError);page.off('response',onResponse);page.off('requestfailed',onRequestFailed);}
  }await context.close();}
  const request=await browser.newContext();const page=await request.newPage();for(const [url,from]of links){try{const r=await request.request.get(url,{timeout:20000});if(r.status()!==200)throw Error('HTTP '+r.status());const u=new URL(url);if(u.hash){const html=await r.text();const exists=await page.evaluate(({html,id})=>!!new DOMParser().parseFromString(html,'text/html').getElementById(id),{html,id:decodeURIComponent(u.hash.slice(1))});if(!exists)throw Error('Missing fragment');}}catch(e){failures.push({from,url,error:e.message});}}await request.close();
 }finally{await browser.close();}
 const report={schemaVersion:1,checkedAt:new Date().toISOString(),fingerprint:fp,baseUrl:base.href,mode,viewportMatrix:VIEWPORTS,cases,warnings,checkedInternalLinks:links.size,failures};const path=`evidence/technical-${mode}.json`;await putJson(resolve(root,path),report);
 const file=mode==='local'?'qa.json':'publication.json',record=await json(resolve(root,file));if(mode==='local'){record.fingerprint=fp;record.technical=await reference(root,path);}else record.hostedQa=await reference(root,path);await putJson(resolve(root,file),record);
 if(failures.length)throw Error(`${failures.length} browser checks failed; see ${path}`);return {mode,cases:cases.length,warnings:warnings.length,report:path};
}
