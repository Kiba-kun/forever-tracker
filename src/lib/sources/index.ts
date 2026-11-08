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

/**
 * Fetches every roster character; one failing character is recorded, not fatal. `problems` are parts of a
 * Character that couldn't be read (left unknown in the snapshot): worth reporting, but not stored.
 */
export async function takeSnapshot(
  roster: RosterEntry[],
  source = selectedSource(),
  at = Date.now(),
): Promise<{ snapshot: Snapshot; problems: Snapshot['errors'] }> {
  const results = await Promise.allSettled(roster.map((e) => source.fetchCharacter(e, at)));
  const snapshot: Snapshot = { takenAt: at, source: source.kind, characters: [], errors: [] };
  const problems: Snapshot['errors'] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      snapshot.characters.push(r.value.character);
      for (const message of r.value.problems ?? []) problems.push({ name: roster[i].name, message });
    } else snapshot.errors.push({ name: roster[i].name, message: String(r.reason?.message ?? r.reason) });
  });
  return { snapshot, problems };
}
