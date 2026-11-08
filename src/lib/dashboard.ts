// Turns snapshot history into the view model the dashboard renders.
// The Group is the hero: nothing here ranks Players (see docs/PRODUCT.md).

import { dungeonSuggestions, type DungeonSuggestion } from './dungeons.ts';
import { journeyMarkers, milestonesOver, withRecorded, type JourneyPoint, type Milestone, type RecordedMilestone } from './milestones.ts';
import { fractionalLevel, type CharacterState, type RosterEntry, type Snapshot } from './model.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A Group Milestone every this many Levels earned together. */
export const GROUP_MILESTONE_STEP = 100;

export interface DashboardData {
  source: Snapshot['source'] | null;
  updatedAt: number | null;
  errors: Snapshot['errors'];
  /** Mains in roster order, each with its Player. */
  characters: (CharacterState & { player: string })[];
  /** Levels earned together: every level the Group's Mains gained since level 1. */
  levelsTogether: number;
  /** The next Group Milestone in Levels earned together, and how many levels are left to reach it. */
  nextGroupMilestone: { target: number; remaining: number };
  /** The Journey chart: Levels earned together after each snapshot. One Group line, no per-Player lines. */
  journey: JourneyPoint[];
  /** The Journey log: every Milestone, newest first. */
  milestones: Milestone[];
  /** Group Milestones placed on the Journey line, oldest first. */
  journeyMarkers: (JourneyPoint & { text: string })[];
  /** Dungeons at least two Mains of one faction currently fit, sorted by level range. */
  dungeonSuggestions: DungeonSuggestion[];
  stats: {
    /** Levels the whole Group gained over the last 24h (or the history available). */
    groupGained24h: number;
    activeToday: number;
    /** Hours of history available. */
    historyHours: number;
  };
}

/**
 * @param recorded Milestones from before the tracker could see them, written down by hand
 *   (config/recorded-milestones.json).
 */
export function buildDashboard(snapshots: Snapshot[], roster: RosterEntry[], recorded: RecordedMilestone[] = []): DashboardData {
  const latest = snapshots.at(-1);

  if (!latest) {
    return {
      source: null, updatedAt: null, errors: [], characters: [], levelsTogether: 0,
      nextGroupMilestone: nextGroupMilestoneAfter(0), journey: [], milestones: withRecorded([], recorded, roster), journeyMarkers: [], dungeonSuggestions: [],
      stats: { groupGained24h: 0, activeToday: 0, historyHours: 0 },
    };
  }

  // The roster is the source of truth for who is in the Group and whose Main is whose.
  // A Character no longer in the roster (e.g. before a reroll is re-polled) is left out.
  const characters = latest.characters
    .map((c) => ({ c, slot: roster.findIndex((r) => r.name === c.name) }))
    .filter(({ slot }) => slot !== -1)
    .sort((a, b) => a.slot - b.slot)
    .map(({ c, slot }) => ({ ...c, player: roster[slot].player }));

  // Compare with the newest snapshot that is at least 24h older than the latest.
  const cutoff = latest.takenAt - DAY;
  const dayAgo = [...snapshots].reverse().find((s) => s.takenAt <= cutoff) ?? snapshots[0];
  const levelDayAgo = new Map(dayAgo.characters.map((c) => [c.name, fractionalLevel(c)]));
  const groupGained24h = characters.reduce((n, c) => {
    const now = fractionalLevel(c);
    return n + Math.max(0, now - (levelDayAgo.get(c.name) ?? now));
  }, 0);

  const journey = journeyOver(snapshots);
  const levelsTogether = journey.at(-1)!.levelsTogether;
  const milestones = withRecorded(milestonesOver(snapshots, roster, journey, GROUP_MILESTONE_STEP), recorded, roster);

  return {
    source: latest.source,
    updatedAt: latest.takenAt,
    errors: latest.errors,
    characters,
    levelsTogether,
    journey,
    milestones,
    journeyMarkers: journeyMarkers(milestones, journey),
    dungeonSuggestions: dungeonSuggestions(characters),
    nextGroupMilestone: nextGroupMilestoneAfter(levelsTogether),
    stats: {
      groupGained24h,
      activeToday: characters.filter((c) => latest.takenAt - c.lastLogin < DAY).length,
      historyHours: (latest.takenAt - snapshots[0].takenAt) / HOUR,
    },
  };
}

/** The next Group Milestone: the next multiple of GROUP_MILESTONE_STEP above Levels earned together. */
function nextGroupMilestoneAfter(levelsTogether: number): DashboardData['nextGroupMilestone'] {
  const target = (Math.floor(levelsTogether / GROUP_MILESTONE_STEP) + 1) * GROUP_MILESTONE_STEP;
  return { target, remaining: target - levelsTogether };
}

/**
 * Levels earned together after each snapshot: for every Character ever recorded, (highest level seen - 1), summed.
 * The poller only records the roster's Mains, so every recorded Character was a Main when it was polled.
 * Rerolled Mains, Players who left the Group and Mains a poll failed to fetch all keep counting,
 * so the line never drops.
 */
function journeyOver(snapshots: Snapshot[]): DashboardData['journey'] {
  const highestLevel = new Map<string, number>();
  return snapshots.map((s) => {
    for (const c of s.characters) highestLevel.set(c.name, Math.max(c.level, highestLevel.get(c.name) ?? 0));
    return { t: s.takenAt, levelsTogether: [...highestLevel.values()].reduce((n, level) => n + level - 1, 0) };
  });
}
