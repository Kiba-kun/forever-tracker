// Rebuilds data/snapshots.json with mock history from launch until now (every 2h),
// so the dashboard has something to draw before the real API is available.
import { roster } from '../src/lib/roster.ts';
import { LAUNCH_AT, mockSource } from '../src/lib/sources/mock.ts';
import { takeSnapshot } from '../src/lib/sources/index.ts';
import { readSnapshots, writeSnapshots } from '../src/lib/store.ts';
import type { Snapshot } from '../src/lib/model.ts';

const existing = await readSnapshots();
if (existing.some((s) => s.source !== 'mock') && !process.argv.includes('--force')) {
  console.error('data/snapshots.json holds real history. Refusing to overwrite it (pass --force to do it anyway).');
  process.exit(1);
}

const STEP = 2 * 3_600_000;
const snapshots: Snapshot[] = [];
for (let t = LAUNCH_AT; t <= Date.now(); t += STEP) snapshots.push((await takeSnapshot(roster, mockSource, t)).snapshot);
snapshots.push((await takeSnapshot(roster, mockSource, Date.now())).snapshot);
await writeSnapshots(snapshots);
console.log(`Seeded ${snapshots.length} mock snapshots.`);
