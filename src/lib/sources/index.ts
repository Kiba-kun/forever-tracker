import type { RosterEntry, Snapshot } from '../model.ts';
import { armorySource } from './armory.ts';
import { blizzardSource } from './blizzard.ts';
import { mockSource } from './mock.ts';
import type { CharacterSource } from './types.ts';

export function selectedSource(): CharacterSource {
  switch (process.env.DATA_SOURCE) {
    case 'blizzard': return blizzardSource;
    case 'armory': return armorySource;
    default: return mockSource;
  }
}

/** Fetches every roster character; one failing character is recorded, not fatal. */
export async function takeSnapshot(roster: RosterEntry[], source = selectedSource(), at = Date.now()): Promise<Snapshot> {
  const results = await Promise.allSettled(roster.map((e) => source.fetchCharacter(e, at)));
  const snapshot: Snapshot = { takenAt: at, source: source.kind, characters: [], errors: [] };
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') snapshot.characters.push(r.value);
    else snapshot.errors.push({ name: roster[i].name, message: String(r.reason?.message ?? r.reason) });
  });
  return snapshot;
}
