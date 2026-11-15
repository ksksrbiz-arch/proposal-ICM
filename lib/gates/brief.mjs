import {safePath} from '../files.mjs';
import {packet, timestamp} from './shared.mjs';
export async function brief(ctx, c) {
  const {root} = ctx;
  const p = ctx.p = await packet(root, 'project');
  c(p.permissions.build.granted, 'brief.build-authority-missing', 'Build authority not recorded');
  for (const [action, a] of Object.entries(p.permissions)) if (a.granted) c(a.instruction.trim().length >= 12 && timestamp(a.at), 'brief.authority-record-incomplete', `Missing actual user instruction/date for ${action}`);
  c(p.builder !== p.reviewer, 'brief.reviewer-not-independent', 'Builder and independent reviewer must differ');
  await safePath(root, p.outputDir, {mustExist: false});
}
