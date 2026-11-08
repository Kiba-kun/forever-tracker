import rosterFile from '../../config/roster.json' with { type: 'json' };
import type { RosterEntry } from './model.ts';

/** The Group's Mains, in the fixed order the dashboard shows them. */
export const roster: RosterEntry[] = rosterFile.characters as RosterEntry[];

const unnamed = roster.filter((r) => typeof r.player !== 'string' || !r.player.trim());
if (unnamed.length) {
  throw new Error(
    `config/roster.json: every Main needs a "player" (the person it belongs to). Missing for: ${unnamed.map((r) => r.name).join(', ')}`,
  );
}
