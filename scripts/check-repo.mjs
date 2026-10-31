import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv from 'ajv';
import {files,json,within} from '../lib/files.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));const paths=await files(root,{omit:['node_modules','.git','work','reports'].map(x=>resolve(root,x))});const issues=[];let links=0;
for(const path of paths){if(path.endsWith('.json'))try{await json(resolve(root,path));}catch(e){issues.push(`${path}: invalid JSON`);}if(path.endsWith('.md')){const body=await readFile(resolve(root,path),'utf8');for(const match of body.matchAll(/\]\(([^)]+)\)/g)){const link=match[1];if(/^(https?:|mailto:|#)/.test(link)||link.includes('<'))continue;const target=resolve(dirname(resolve(root,path)),link.split('#')[0]);if(!within(root,target))issues.push(`${path}: escaping documentation link`);else try{await readFile(target);links++;}catch{issues.push(`${path}: broken link ${link}`);}}}}
const ajv=new Ajv({strict:true});for(const path of ['schemas/artifacts.schema.json','schemas/batch.schema.json']){const s=await json(resolve(root,path));if(!ajv.validateSchema(s))issues.push(path+': invalid JSON schema');}
for(const path of ['AGENTS.md','.icm/INDEX.md','prompts/worker.md','prompts/reviewer.md','prompts/orchestrator.md'])if(!(await readFile(resolve(root,path),'utf8')).trim())issues.push(path+': empty instructions');
console.log(JSON.stringify({files:paths.length,localDocLinks:links,issues},null,2));if(issues.length)process.exitCode=1;
