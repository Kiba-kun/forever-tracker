// Turns snapshot history into the view model the dashboard renders.
// The Group is the hero: nothing here ranks Players (see docs/PRODUCT.md).

import { fractionalLevel, type CharacterState, type RosterEntry, type Snapshot } from './model.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export interface DashboardData {
  source: Snapshot['source'] | null;
  updatedAt: number | null;
  errors: Snapshot['errors'];
  /** Mains in roster order, each with its Player. `slot` is the roster index and drives the Main's colour. */
  characters: (CharacterState & { player: string; slot: number })[];
  stats: {
    avgLevel: number;
    /** Levels the whole Group gained over the last 24h (or the history available). */
    groupGained24h: number;
    activeToday: number;
    /** Hours of history available. */
    historyHours: number;
  };
  classMix: { className: string; count: number }[];
}

export function buildDashboard(snapshots: Snapshot[], roster: RosterEntry[]): DashboardData {
  const latest = snapshots.at(-1);

  if (!latest) {
    return {
      source: null, updatedAt: null, errors: [], characters: [],
      stats: { avgLevel: 0, groupGained24h: 0, activeToday: 0, historyHours: 0 }, classMix: [],
    };
  }

  // The roster is the source of truth for who is in the Group and whose Main is whose.
  // A Character no longer in the roster (e.g. before a reroll is re-polled) is left out.
  const characters = latest.characters
    .map((c) => ({ c, slot: roster.findIndex((r) => r.name === c.name) }))
    .filter(({ slot }) => slot !== -1)
    .sort((a, b) => a.slot - b.slot)
    .map(({ c, slot }) => ({ ...c, player: roster[slot].player, slot }));

  // Compare with the newest snapshot that is at least 24h older than the latest.
  const cutoff = latest.takenAt - DAY;
  const dayAgo = [...snapshots].reverse().find((s) => s.takenAt <= cutoff) ?? snapshots[0];
  const levelDayAgo = new Map(dayAgo.characters.map((c) => [c.name, fractionalLevel(c)]));
  const groupGained24h = characters.reduce((n, c) => {
    const now = fractionalLevel(c);
    return n + Math.max(0, now - (levelDayAgo.get(c.name) ?? now));
  }, 0);

  const mix = new Map<string, number>();
  for (const c of characters) mix.set(c.className, (mix.get(c.className) ?? 0) + 1);

  return {
    source: latest.source,
    updatedAt: latest.takenAt,
    errors: latest.errors,
    characters,
    stats: {
      avgLevel: characters.reduce((n, c) => n + c.level, 0) / Math.max(characters.length, 1),
      groupGained24h,
      activeToday: characters.filter((c) => latest.takenAt - c.lastLogin < DAY).length,
      historyHours: (latest.takenAt - snapshots[0].takenAt) / HOUR,
    },
    classMix: [...mix].map(([className, count]) => ({ className, count })).sort((a, b) => b.count - a.count),
  };
}
