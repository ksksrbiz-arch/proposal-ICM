import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {chromium} from 'playwright';
import {launchOptions} from './browser-qa.mjs';
import {lessons} from './learning.mjs';

const exec = promisify(execFile), require = createRequire(import.meta.url);

/** Environment readiness. Read-only: launches a browser briefly, writes nothing, contacts nothing. */
export async function doctor() {
  const checks = [];
  const add = (name, ok, detail, {required = true, fix = ''} = {}) => checks.push({name, ok, required, detail, ...(ok ? {} : {fix})});
  const major = +process.versions.node.split('.')[0];
  add('node', major >= 22, `Node ${process.versions.node}`, {fix: 'Install Node 22 or newer.'});
  try {
    const browser = await chromium.launch({headless: true, timeout: 15000, ...launchOptions()});
    add('browser', true, `Chromium ${browser.version()}`);
    await browser.close();
  } catch (e) {
    add('browser', false, e.message.split('\n')[0], {fix: 'Run `npx playwright install chromium`, or set PLAYWRIGHT_EXECUTABLE_PATH / PLAYWRIGHT_CHANNEL=chrome.'});
  }
  try { add('axe-core', true, `axe-core ${require('axe-core/package.json').version}`); }
  catch { add('axe-core', false, 'not installed', {fix: 'Run `npm ci`.'}); }
  try { await exec('git', ['--version']); add('git', true, 'available', {required: false}); }
  catch { add('git', false, 'not found', {required: false, fix: 'Needed only for lesson promotion checks.'}); }
  try { add('lessons', true, `${(await lessons()).length} adopted lessons`); }
  catch (e) { add('lessons', false, e.message); }
  add('maintainer-repo', !!process.env.ICM_MAINTAINER_REPO, process.env.ICM_MAINTAINER_REPO ? 'set' : 'not set (only needed to promote lessons from an installed package)', {required: false, fix: 'Set ICM_MAINTAINER_REPO to a source clone to promote lessons.'});
  return {ok: checks.every(c => c.ok || !c.required), checks};
}
