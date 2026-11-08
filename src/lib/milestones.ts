// Milestones: noteworthy moments on the Journey, noticed by comparing each snapshot with what came before.
// The armory keeps no history, so this is the only record of them. Recomputed from the full snapshot history on
// every build, so fixing a rule here also fixes the past. Terms (Milestone, Baseline, Main...) are in CONTEXT.md.

import { betterGear, type CharacterState, type GearQuality, type RosterEntry, type Snapshot } from './model.ts';

const LEVEL_MILESTONES = [10, 20, 30, 40, 50, 60];
/** Profession tiers by the skill cap they unlock (original-era game). Apprentice (75) is not a Milestone. */
const PROFESSION_TIERS = [
  { tier: 'Journeyman', cap: 150 },
  { tier: 'Expert', cap: 225 },
  { tier: 'Artisan', cap: 300 },
] as const;
/** Gear qualities whose first equipped item is a Milestone. */
const GEAR_FIRSTS = ['Rare', 'Epic'] as const satisfies readonly GearQuality[];

/** Levels earned together after one snapshot. */
export interface JourneyPoint {
  t: number;
  levelsTogether: number;
}

interface PersonalMilestone {
  at: number;
  player: string;
  character: string;
  text: string;
}

interface GroupMilestone {
  at: number;
  text: string;
}

export type Milestone =
  | (PersonalMilestone & { kind: 'level'; level: number })
  | (PersonalMilestone & { kind: 'spec'; spec: string; previous: string | null })
  | (PersonalMilestone & { kind: 'profession'; profession: string; tier: (typeof PROFESSION_TIERS)[number]['tier'] })
  | (PersonalMilestone & { kind: 'gear'; quality: (typeof GEAR_FIRSTS)[number] })
  | (PersonalMilestone & { kind: 'honor-rank'; rank: number })
  | (GroupMilestone & { kind: 'levels-together'; levelsTogether: number })
  | (GroupMilestone & { kind: 'whole-group-level'; level: number });

export function isGroupMilestone(m: Milestone): m is Extract<Milestone, { kind: 'levels-together' | 'whole-group-level' }> {
  return m.kind === 'levels-together' || m.kind === 'whole-group-level';
}

/**
 * What the tracker last knew about one Player's Main. `undefined` means "never reported": the first reported
 * value is a Baseline, and later gaps in what the armory reports never replace what was known.
 */
interface MainState {
  character: string;
  level: number;
  /** `null`: no spec chosen yet. Once a spec is known, a `null` from the armory doesn't replace it. */
  spec: string | null | undefined;
  /** Highest skill cap seen per profession. A profession missing from one report keeps its cap. */
  professionCaps: Map<string, number> | undefined;
  /** Best gear quality ever equipped: "first Rare" means first ever, so swapping a Rare out and back is quiet. */
  bestGear: GearQuality | undefined;
  /** Highest honor rank ever reached: a rank lost to weekly decay and regained is not marked again. */
  bestHonorRank: number | undefined;
}

/**
 * Every Milestone in the history, newest first.
 * @param journey Levels earned together after each snapshot (same order and length as `snapshots`).
 * @param groupStep A Group Milestone every this many Levels earned together.
 */
export function milestonesOver(
  snapshots: Snapshot[],
  roster: RosterEntry[],
  journey: JourneyPoint[],
  groupStep: number,
): Milestone[] {
  const playerByCharacter = playersByCharacter(snapshots, roster);
  const groupPlayers = [...new Set(roster.map((r) => r.player))];
  const mains = new Map<string, MainState>();
  const recorded = new Set<string>();
  /** Levels the whole Group has reached (announced or Baseline); undefined until every Player's Main is known. */
  let wholeGroupLevels: Set<number> | undefined;
  const found: Milestone[] = [];

  snapshots.forEach((s, i) => {
    // Levels a Character brings when first recorded are a Baseline, not levels earned on the Journey.
    let firstSightingLevels = 0;
    for (const c of s.characters) {
      if (!recorded.has(c.name)) firstSightingLevels += c.level - 1;
      recorded.add(c.name);

      const player = playerByCharacter.get(c.name);
      if (!player) continue;
      const before = mains.get(player);
      // First sighting of a Main (including a new Main after a switch) is a Baseline:
      // nothing it already had becomes a Milestone.
      const sameMain = before?.character === c.name ? before : undefined;
      if (sameMain) found.push(...personalMilestones(s.takenAt, player, sameMain, c));
      mains.set(player, remember(sameMain, c));
    }

    // Levels earned together passing a multiple of groupStep. The first snapshot is the Baseline.
    if (i > 0) {
      const from = journey[i - 1].levelsTogether + firstSightingLevels;
      const to = journey[i].levelsTogether;
      for (let n = (Math.floor(from / groupStep) + 1) * groupStep; n <= to; n += groupStep) {
        found.push({ at: s.takenAt, kind: 'levels-together', levelsTogether: n, text: `The Group has earned ${n} levels together` });
      }
    }

    // Every current Main at or above a level. Only judged once every Player's Main has been seen;
    // what's already true then is the Baseline.
    if (groupPlayers.every((p) => mains.has(p))) {
      const lowest = Math.min(...groupPlayers.map((p) => mains.get(p)!.level));
      const reachedNow = LEVEL_MILESTONES.filter((l) => lowest >= l);
      if (!wholeGroupLevels) wholeGroupLevels = new Set(reachedNow);
      for (const level of reachedNow) {
        if (wholeGroupLevels.has(level)) continue;
        wholeGroupLevels.add(level);
        found.push({ at: s.takenAt, kind: 'whole-group-level', level, text: `The whole Group reached level ${level}` });
      }
    }
  });

  // Newest first. Within one snapshot, later-detected Milestones (e.g. level 30 after 20) come first too.
  return found.reverse().sort((a, b) => b.at - a.at);
}

/** Group Milestones placed on the Journey line, oldest first. */
export function journeyMarkers(milestones: Milestone[], journey: JourneyPoint[]): (JourneyPoint & { text: string })[] {
  const levelsAt = new Map(journey.map((p) => [p.t, p.levelsTogether]));
  return milestones
    .filter(isGroupMilestone)
    .map((m) => ({ t: m.at, levelsTogether: levelsAt.get(m.at)!, text: m.text }))
    .reverse();
}

/**
 * Whose Main each recorded Character is. The roster decides for current Mains; otherwise any record of that
 * Character that names its Player does (the poller names Players on stored records while they're in the roster).
 */
function playersByCharacter(snapshots: Snapshot[], roster: RosterEntry[]): Map<string, string> {
  const players = new Map<string, string>();
  for (const s of snapshots) for (const c of s.characters) if (c.player && !players.has(c.name)) players.set(c.name, c.player);
  for (const r of roster) players.set(r.name, r.player);
  return players;
}

/** The Main's state after this record. */
function remember(before: MainState | undefined, now: CharacterState): MainState {
  let professionCaps = before?.professionCaps;
  if (now.professions) {
    professionCaps = new Map(professionCaps);
    for (const p of now.professions) professionCaps.set(p.name, Math.max(p.max, professionCaps.get(p.name) ?? 0));
  }
  return {
    character: now.name,
    level: now.level,
    spec: now.spec === undefined || (now.spec === null && before?.spec) ? before?.spec : now.spec,
    professionCaps,
    bestGear: betterGear(before?.bestGear, now.gearQuality),
    bestHonorRank: now.honorRank == null ? before?.bestHonorRank : Math.max(now.honorRank, before?.bestHonorRank ?? 0),
  };
}

function personalMilestones(at: number, player: string, before: MainState, now: CharacterState): Milestone[] {
  const who = { at, player, character: now.name };
  const found: Milestone[] = LEVEL_MILESTONES.filter((l) => before.level < l && now.level >= l).map((level) => ({
    ...who, kind: 'level' as const, level, text: `${player} reached level ${level}`,
  }));

  if (before.spec !== undefined && now.spec && now.spec !== before.spec) {
    const verb = before.spec === null ? 'chose' : 'switched to';
    found.push({ ...who, kind: 'spec', spec: now.spec, previous: before.spec, text: `${player} ${verb} ${now.spec} ${now.className}` });
  }

  if (before.professionCaps && now.professions) {
    for (const p of now.professions) {
      const capBefore = before.professionCaps.get(p.name) ?? 0;
      for (const { tier, cap } of PROFESSION_TIERS) {
        if (capBefore < cap && p.max >= cap) {
          found.push({ ...who, kind: 'profession', profession: p.name, tier, text: `${player} reached ${tier} in ${p.name}` });
        }
      }
    }
  }

  // Jumping past both between two polls marks both, like level thresholds.
  if (before.bestGear !== undefined && now.gearQuality != null) {
    for (const first of GEAR_FIRSTS) {
      const reachedNow = betterGear(now.gearQuality, first) === now.gearQuality;
      const hadBefore = betterGear(before.bestGear, first) === before.bestGear;
      if (reachedNow && !hadBefore) {
        found.push({ ...who, kind: 'gear', quality: first, text: `${player} equipped their first ${first} item` });
      }
    }
  }

  if (before.bestHonorRank !== undefined && now.honorRank != null) {
    for (let rank = before.bestHonorRank + 1; rank <= now.honorRank; rank++) {
      found.push({ ...who, kind: 'honor-rank', rank, text: `${player} reached honor rank ${rank}` });
    }
  }

  return found;
}
