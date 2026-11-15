import {CODES} from './catalog.mjs';
export class GateError extends Error {
  constructor(stage, issues) {
    super(issues.map(i => i.message).join('; '));
    this.name = 'GateError';
    this.stage = stage;
    this.issues = issues;
  }
}
/** Collects failures for one stage without stopping at the first. Unknown codes are a programming error. */
export function checker(stage) {
  const issues = [];
  const check = (ok, code, message, detail = {}) => {
    if (!CODES[code]) throw Error(`Unknown gate code: ${code}`);
    if (!ok) issues.push({stage, code, message, ...detail});
    return !!ok;
  };
  check.unique = (values, label, code = `${stage}.duplicate`) => check(new Set(values).size === values.length, code, `Duplicate ${label}`);
  return {issues, check};
}
