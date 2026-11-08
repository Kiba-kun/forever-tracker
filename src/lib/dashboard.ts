// Turns snapshot history into the view model the dashboard renders.

import { fractionalLevel, type CharacterState, type Snapshot } from './model.ts';

const DAY = 86_400_000;

export interface RaceSeries {
  name: string;
  /** Roster index — drives the series color, so colors never follow rank. */
  slot: number;
}

export interface DashboardData {
  source: Snapshot['source'] | null;
  updatedAt: number | null;
  errors: Snapshot['errors'];
  characters: (CharacterState & { slot: number; gained24h: number })[];
  series: RaceSeries[];
  /** One row per snapshot: { t, [name]: fractional level }. */
  race: Record<string, number>[];
  stats: {
    avgLevel: number;
    leader: CharacterState | null;
    groupGained24h: number;
    activeToday: number;
    /** Hours of history available. */
    historyHours: number;
  };
  classMix: { className: string; count: number }[];
}

export function buildDashboard(snapshots: Snapshot[], rosterNames: string[]): DashboardData {
  const latest = snapshots.at(-1);
  const slotOf = (name: string) => {
    const i = rosterNames.indexOf(name);
    return i === -1 ? rosterNames.length : i;
  };

  if (!latest) {
    return {
      source: null, updatedAt: null, errors: [], characters: [], series: [], race: [],
      stats: { avgLevel: 0, leader: null, groupGained24h: 0, activeToday: 0, historyHours: 0 }, classMix: [],
    };
  }

  // Baseline: the newest snapshot that is at least 24h older than the latest.
  const cutoff = latest.takenAt - DAY;
  const baseline = [...snapshots].reverse().find((s) => s.takenAt <= cutoff) ?? snapshots[0];
  const baseLevel = new Map(baseline.characters.map((c) => [c.name, fractionalLevel(c)]));

  const characters = latest.characters
    .map((c) => ({
      ...c,
      slot: slotOf(c.name),
      gained24h: Math.max(0, fractionalLevel(c) - (baseLevel.get(c.name) ?? fractionalLevel(c))),
    }))
    .sort((a, b) => fractionalLevel(b) - fractionalLevel(a));

  const series = latest.characters
    .map((c) => ({ name: c.name, slot: slotOf(c.name) }))
    .sort((a, b) => a.slot - b.slot);

  const race = snapshots.map((s) => {
    const row: Record<string, number> = { t: s.takenAt };
    for (const c of s.characters) row[c.name] = Math.round(fractionalLevel(c) * 100) / 100;
    return row;
  });

  const mix = new Map<string, number>();
  for (const c of latest.characters) mix.set(c.className, (mix.get(c.className) ?? 0) + 1);

  return {
    source: latest.source,
    updatedAt: latest.takenAt,
    errors: latest.errors,
    characters,
    series,
    race,
    stats: {
      avgLevel: characters.reduce((n, c) => n + c.level, 0) / Math.max(characters.length, 1),
      leader: characters[0] ?? null,
      groupGained24h: characters.reduce((n, c) => n + c.gained24h, 0),
      activeToday: characters.filter((c) => latest.takenAt - c.lastLogin < DAY).length,
      historyHours: (latest.takenAt - snapshots[0].takenAt) / 3_600_000,
    },
    classMix: [...mix].map(([className, count]) => ({ className, count })).sort((a, b) => b.count - a.count),
  };
}
