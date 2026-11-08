// Snapshot history in a local JSON file. Good enough for 8 characters polled
// every 15 minutes (~35k snapshots/year); swap for SQLite/KV when hosting.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RosterEntry, Snapshot } from './model.ts';

const FILE = path.join(process.cwd(), 'data', 'snapshots.json');

export async function readSnapshots(): Promise<Snapshot[]> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as Snapshot[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}

export async function writeSnapshots(snapshots: Snapshot[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  await writeFile(tmp, JSON.stringify(snapshots));
  await rename(tmp, FILE);
}

/** Appends a snapshot. History from a different source (e.g. mock) is discarded, never mixed. */
export async function appendSnapshot(snapshot: Snapshot): Promise<{ discarded: number }> {
  const all = await readSnapshots();
  const kept = all.filter((s) => s.source === snapshot.source);
  kept.push(snapshot);
  await writeSnapshots(kept);
  return { discarded: all.length - (kept.length - 1) };
}

/**
 * Names the Player on stored records that lack one (records polled before Players were required), using the
 * roster. Run while a Main is still in the roster, this keeps their history attributed after a later reroll.
 */
export function namePlayers(snapshots: Snapshot[], roster: RosterEntry[]): { snapshots: Snapshot[]; named: number } {
  const playerOf = new Map(roster.map((r) => [r.name, r.player]));
  let named = 0;
  const result = snapshots.map((s) => ({
    ...s,
    characters: s.characters.map((c) => {
      const player = c.player ? undefined : playerOf.get(c.name);
      if (!player) return c;
      named++;
      return { ...c, player };
    }),
  }));
  return { snapshots: result, named };
}
