import {readFile, writeFile, mkdir, readdir, lstat} from 'node:fs/promises';
import {resolve, relative, isAbsolute, sep, dirname} from 'node:path';
import {createHash} from 'node:crypto';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function json(path){return JSON.parse(await readFile(path,'utf8'));}
export async function putJson(path,value){await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(value,null,2)+'\n');}
export function within(root,target){const r=relative(resolve(root),resolve(target));return r===''||(!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep));}
export async function safePath(root,name,{mustExist=true}={}){
 if(typeof name!=='string'||!name||isAbsolute(name)||/^[A-Za-z]:|\\|\0/.test(name)||name.split('/').some(x=>x==='..'||x==='.'||x===''))throw Error(`Unsafe relative path: ${name}`);
 const target=resolve(root,name);if(!within(root,target))throw Error(`Escaping path: ${name}`);
 let p=resolve(root);for(const part of name.split('/')){p=resolve(p,part);try{if((await lstat(p)).isSymbolicLink())throw Error(`Symlink forbidden: ${name}`);}catch(e){if(e.code==='ENOENT'&&!mustExist)continue;throw e;}}
 return target;
}
export async function files(root,{omit=[]}={}){
 const out=[];async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(omit.some(x=>within(x,p)))continue;if(e.isSymbolicLink())throw Error(`Symlink forbidden: ${p}`);if(e.isDirectory())await walk(p);else if(e.isFile())out.push(relative(root,p).split(sep).join('/'));}}
 await walk(root);return out.sort();
}
export async function evidence(root,ref){const p=await safePath(root,ref.path);const bytes=await readFile(p);if(!bytes.length||hash(bytes)!==ref.sha256)throw Error(`Missing/changed evidence: ${ref.path}`);return p;}
export async function reference(root,path){const p=await safePath(root,path);return {path,sha256:hash(await readFile(p))};}
export function webUrl(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function routePath(s){return typeof s==='string'&&s.startsWith('/')&&!s.includes('..')&&!/[?#\\]/.test(s)&&s===(s==='/'?'/':s.replace(/\/$/,''));}
