// Takes one snapshot of the whole roster and appends it to data/snapshots.json.
// Run on a schedule (cron / launchd / hosted cron) every ~15 minutes.
import { roster } from '../src/lib/roster.ts';
import { takeSnapshot } from '../src/lib/sources/index.ts';
import { appendSnapshot, namePlayers, readSnapshots, writeSnapshots } from '../src/lib/store.ts';

// `npm run poll -- --watch [minutes]` keeps polling (default every 15 min).
const watchAt = process.argv.indexOf('--watch');
const everyMin = watchAt === -1 ? 0 : Number(process.argv[watchAt + 1]) || 15;

async function pollOnce() {
  // Older records may not name their Player; name them while their Main is still in the roster.
  const { snapshots: stored, named } = namePlayers(await readSnapshots(), roster);
  if (named) {
    await writeSnapshots(stored);
    console.log(`Named the Player on ${named} stored records.`);
  }

  const { snapshot, problems } = await takeSnapshot(roster);
  const previous = (await readSnapshots()).at(-1);
  const unchanged =
    previous?.source === snapshot.source &&
    JSON.stringify(previous.characters) === JSON.stringify(snapshot.characters);
  if (snapshot.characters.length === 0) {
    console.log(`[${new Date().toLocaleTimeString()}] ${snapshot.source}: every character failed, snapshot not saved`);
  } else if (unchanged) {
    // The armory only refreshes on logout: most polls see nothing new. Skipping keeps history (and git) small.
    console.log(`[${new Date().toLocaleTimeString()}] ${snapshot.source}: no changes, snapshot not saved`);
  } else {
    const { discarded } = await appendSnapshot(snapshot);
    if (discarded) console.log(`Discarded ${discarded} snapshots from another data source.`);
    console.log(`[${new Date().toLocaleTimeString()}] ${snapshot.source}: ${snapshot.characters.length} characters, ${snapshot.errors.length} errors`);
  }
  for (const c of snapshot.characters) console.log(`  ${c.name.padEnd(24)} lvl ${String(c.level).padEnd(3)} ${c.race} ${c.spec ? c.spec + ' ' : ''}${c.className}`);
  for (const e of snapshot.errors) console.log(`  ✗ ${e.name}: ${e.message}`);
  // A sub-page that failed only leaves its summary unknown; listed so a page format change gets noticed.
  for (const p of problems) console.log(`  ⚠ ${p.name}: ${p.message} (left unknown)`);
}

await pollOnce();
if (everyMin) {
  console.log(`Polling every ${everyMin} min. Ctrl+C to stop.`);
  setInterval(() => pollOnce().catch((e) => console.error(e)), everyMin * 60_000);
}
