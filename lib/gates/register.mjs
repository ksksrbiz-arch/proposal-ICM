import {evidence} from '../files.mjs';
import {packet} from './shared.mjs';
export async function register(ctx, c) {
  const {root, p} = ctx;
  c(p.permissions.tracker.granted, 'register.not-authorized', 'Tracker mutation not authorized');
  const t = await packet(root, 'tracker');
  c(t.projectId === p.projectId && t.applied && t.preservationVerified && t.tableCoverageVerified, 'register.incomplete', 'Tracker application/preservation/readback incomplete');
  for (const ref of [t.writePlan, t.before, t.after]) await evidence(root, ref);
}
