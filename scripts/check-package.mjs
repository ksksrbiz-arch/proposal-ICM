import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,symlink,realpath} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {files} from '../lib/files.mjs';
const exec=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));
const npm=process.env.npm_execpath;
assert.ok(npm?.endsWith('.js'),'Run with npm run check:package so the current npm CLI is used.');
// npm 12 exports user .npmrc allow-scripts into lifecycle env, then rejects that env
// in nested project installs. Let the child read its normal .npmrc policy instead.
const installEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^npm_config_allow[_-]scripts/i.test(key)));
const scratch=await mkdtemp(join(tmpdir(),'proposal icm package-'));
const packResult=JSON.parse((await exec(process.execPath,[npm,'pack','--json','--ignore-scripts','--pack-destination',scratch],{cwd:root,maxBuffer:4e6})).stdout);
// npm 12 keys pack results by package name; older supported npm versions return an array.
const packed=Array.isArray(packResult)?packResult[0]:Object.values(packResult)[0];
const meta=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
const expected=new Set(['package.json','README.md']);
for(const path of meta.files){if(path.endsWith('/'))for(const child of await files(resolve(root,path)))expected.add(path+child);else expected.add(path);}
assert.deepEqual(packed.files.map(x=>x.path).sort(),[...expected].sort(),'Tarball must contain only the explicit public instruction/runtime files.');
const tarball=resolve(scratch,packed.filename),consumer=resolve(scratch,'clean consumer');
await mkdir(consumer);await writeFile(resolve(consumer,'package.json'),JSON.stringify({name:'synthetic-install-check',private:true}));
await exec(process.execPath,[npm,'install','--omit=dev','--ignore-scripts','--no-audit','--no-fund',tarball],{cwd:consumer,env:installEnv,maxBuffer:4e6});
const installed=resolve(consumer,'node_modules/proposal-icm'),bin=resolve(installed,'bin/icm.mjs');
const cli=async args=>(await exec(process.execPath,[bin,...args],{cwd:consumer})).stdout.trim();
assert.equal(await cli(['--version']),meta.version);
assert.match(await cli(['--help']),/gate <privateDir>/);
assert.equal(await realpath(await cli(['root'])),await realpath(installed));
assert.ok(JSON.parse(await cli(['lessons','design'])).length>=2);
await readFile(resolve(installed,'.icm/INDEX.md'));await readFile(resolve(installed,'stages/09-learn/CONTEXT.md'));
const project=resolve(consumer,'private proposal');
assert.equal(JSON.parse(await cli(['init',project])).authority,'none; actual user instruction required');
assert.equal(JSON.parse(await cli(['status',project])).state.currentStage,'brief');
await assert.rejects(cli(['gate',project,'research']),e=>e.code===1&&e.stderr.includes('ICM BLOCKED:'));
assert.equal(JSON.parse(await cli(['retrospect',project,'blocked'])).path,'learning.json');
// Exercise the real npm shim, including Windows quoting and POSIX executable/symlink setup.
if(process.platform==='win32'){
 const shim=resolve(consumer,'node_modules/.bin/proposal-icm.cmd');
 const r=await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',`& '${shim.replaceAll("'","''")}' --version`],{cwd:consumer});
 assert.equal(r.stdout.trim(),meta.version);
}else assert.equal((await exec(resolve(consumer,'node_modules/.bin/proposal-icm'),['--version'],{cwd:consumer})).stdout.trim(),meta.version);
// Windows junctions reproduce a changed argv path without requiring symlink privileges.
const alias=resolve(consumer,'aliased package');await symlink(installed,alias,process.platform==='win32'?'junction':'dir');
assert.equal((await exec(process.execPath,[resolve(alias,'bin/icm.mjs'),'--version'],{cwd:consumer})).stdout.trim(),meta.version);
const sha256=createHash('sha256').update(await readFile(tarball)).digest('hex');
const report={package:meta.name,version:meta.version,files:packed.files.length,tarball,sha256,integrity:packed.integrity,productionInstall:'passed',npmShim:'passed',aliasedEntry:'passed',privateProjectAndFailClosedGate:'passed'};
await writeFile(resolve(scratch,'package-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
