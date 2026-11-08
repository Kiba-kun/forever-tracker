// Milestones: noteworthy moments on the Journey, noticed by comparing each snapshot with what came before.
// The armory keeps no history, so this is the only record of them. Recomputed from the full snapshot history on
// every build, so fixing a rule here also fixes the past. Terms (Milestone, Baseline, Main...) are in CONTEXT.md.

import { STANDINGS, betterGear, type CharacterState, type CollectedMount, type EquippedItem, type GearQuality, type RosterEntry, type Snapshot, type Standing } from './model.ts';

const LEVEL_MILESTONES = [10, 20, 30, 40, 50, 60];
/** Profession tiers by the skill cap they unlock (original-era game). Apprentice (75) is not a Milestone. */
const PROFESSION_TIERS = [
  { tier: 'Journeyman', cap: 150 },
  { tier: 'Expert', cap: 225 },
  { tier: 'Artisan', cap: 300 },
] as const;
/** Gear qualities whose first equipped item is a Milestone. */
const GEAR_FIRSTS = ['Rare', 'Epic'] as const satisfies readonly GearQuality[];
/** Reputation standings worth a Milestone. */
const STANDING_MILESTONES = ['Honored', 'Revered', 'Exalted'] as const satisfies readonly Standing[];

/** Levels earned together after one snapshot. */
export interface JourneyPoint {
  t: number;
  levelsTogether: number;
}

interface PersonalFields {
  at: number;
  /** Set on a recorded Milestone: only its day is known (YYYY-MM-DD), and `at` is midday UTC of it. */
  day?: string;
  player: string;
  character: string;
  text: string;
}

interface GroupMilestone {
  at: number;
  text: string;
}

export type Milestone =
  | (PersonalFields & { kind: 'level'; level: number })
  | (PersonalFields & { kind: 'spec'; spec: string; previous: string | null })
  | (PersonalFields & { kind: 'profession'; profession: string; tier: (typeof PROFESSION_TIERS)[number]['tier'] })
  /** `items`: the equipped items of that Quality when it happened; missing when the gear wasn't read. */
  | (PersonalFields & { kind: 'gear'; quality: (typeof GEAR_FIRSTS)[number]; items?: EquippedItem[] })
  | (PersonalFields & { kind: 'honor-rank'; rank: number })
  | (PersonalFields & { kind: 'reputation'; faction: string; standing: (typeof STANDING_MILESTONES)[number] })
  | (PersonalFields & { kind: 'dungeon-achievement' | 'raid-achievement' })
  /** `mounts`: the mounts collected when it happened; missing when they weren't read. */
  | (PersonalFields & { kind: 'mount'; mounts?: CollectedMount[] })
  | (GroupMilestone & { kind: 'levels-together'; levelsTogether: number })
  | (GroupMilestone & { kind: 'whole-group-level'; level: number })
  | (GroupMilestone & { kind: 'group-dungeon-achievement' | 'group-mounted' });

type GroupMilestoneKind = 'levels-together' | 'whole-group-level' | 'group-dungeon-achievement' | 'group-mounted';

/** A Milestone reached by one Main. */
export type PersonalMilestone = Exclude<Milestone, { kind: GroupMilestoneKind }>;

export function isGroupMilestone(m: Milestone): m is Extract<Milestone, { kind: GroupMilestoneKind }> {
  return !('player' in m);
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
  /** Best standing ever reached per faction: a standing lost and regained is not marked again. */
  bestStandings: Map<string, Standing> | undefined;
  /** Most dungeon / raid achievements and mounts ever seen; only going from none to some is a Milestone. */
  bestDungeons: number | undefined;
  bestRaids: number | undefined;
  bestMounts: number | undefined;
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
  /** Group firsts already true (announced or Baseline); undefined until every current Main's value is known. */
  let groupDungeon: boolean | undefined;
  let groupMounted: boolean | undefined;
  const found: Milestone[] = [];

  snapshots.forEach((s, i) => {
    // Levels a Character brings when first recorded are a Baseline, not levels earned on the Journey.
    let firstSightingLevels = 0;
    const personal: Milestone[] = [];
    for (const c of s.characters) {
      if (!recorded.has(c.name)) firstSightingLevels += c.level - 1;
      recorded.add(c.name);

      const player = playerByCharacter.get(c.name);
      if (!player) continue;
      const before = mains.get(player);
      // First sighting of a Main (including a new Main after a switch) is a Baseline:
      // nothing it already had becomes a Milestone.
      const sameMain = before?.character === c.name ? before : undefined;
      if (sameMain) personal.push(...personalMilestones(s.takenAt, player, sameMain, c));
      mains.set(player, remember(sameMain, c));
    }
    found.push(...personal);

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

    // Group firsts. Judged once every Player's current Main has a known value; what's true then is the Baseline.
    // Later, a first is announced only when a Main's own first makes it true. Becoming true any other way
    // (a Player switching to a Main that already had it) is a Baseline too.
    const currentMains = groupPlayers.map((p) => mains.get(p));
    const groupFirst = (
      valueOf: (m: MainState) => number | undefined,
      holdsForGroup: (values: number[]) => boolean,
      reachedBefore: boolean | undefined,
      personalKind: Milestone['kind'],
      milestone: Extract<Milestone, { kind: GroupMilestoneKind }>,
    ): boolean | undefined => {
      const values = currentMains.map((m) => (m ? valueOf(m) : undefined));
      if (values.some((v) => v === undefined)) return reachedBefore;
      const reached = holdsForGroup(values as number[]);
      if (reachedBefore === undefined || reachedBefore || !reached) return reachedBefore || reached;
      if (personal.some((m) => m.kind === personalKind)) found.push(milestone);
      return true;
    };
    groupDungeon = groupFirst(
      (m) => m.bestDungeons, (v) => v.some((n) => n > 0), groupDungeon, 'dungeon-achievement',
      { at: s.takenAt, kind: 'group-dungeon-achievement', text: 'The Group earned its first dungeon achievement' },
    );
    groupMounted = groupFirst(
      (m) => m.bestMounts, (v) => v.every((n) => n > 0), groupMounted, 'mount',
      { at: s.takenAt, kind: 'group-mounted', text: 'Every Main in the Group has a mount' },
    );
  });

  // Newest first. Within one snapshot, later-detected Milestones (e.g. level 30 after 20) come first too.
  return found.reverse().sort((a, b) => b.at - a.at);
}

/**
 * A Milestone from before the tracker could see it (so its first sighting was a quiet Baseline), written down by hand
 * in config/recorded-milestones.json. Only the day is known.
 */
export interface RecordedMilestone {
  day: string;
  player: string;
  kind: 'gear';
  quality: (typeof GEAR_FIRSTS)[number];
}

/**
 * The detected Milestones with the recorded ones added, newest first. A recorded first replaces the same first
 * detected later, so it's never told twice.
 */
export function withRecorded(milestones: Milestone[], recorded: RecordedMilestone[], roster: RosterEntry[]): Milestone[] {
  const added: Milestone[] = recorded.map((r) => {
    const main = roster.find((e) => e.player === r.player);
    if (!main) throw new Error(`recorded Milestone for "${r.player}", who has no Main in the roster`);
    const [y, m, d] = r.day.split('-').map(Number);
    return {
      at: Date.UTC(y, m - 1, d, 12), day: r.day, kind: r.kind, player: r.player, character: main.name,
      quality: r.quality, text: `${r.player} equipped their first ${r.quality} item`,
    };
  });
  const isRecorded = (m: Milestone) =>
    m.kind === 'gear' && recorded.some((r) => r.player === m.player && r.quality === m.quality);
  return [...milestones.filter((m) => !isRecorded(m)), ...added].sort((a, b) => b.at - a.at);
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
    bestHonorRank: higher(before?.bestHonorRank, now.honorRank),
    bestStandings: rememberStandings(before?.bestStandings, now.reputation),
    bestDungeons: higher(before?.bestDungeons, now.achievements?.dungeons),
    bestRaids: higher(before?.bestRaids, now.achievements?.raids),
    bestMounts: higher(before?.bestMounts, now.mounts),
  };
}

/** The higher of what was known and what's reported now; an unknown report changes nothing. */
function higher(known: number | undefined, now: number | null | undefined): number | undefined {
  return now == null ? known : Math.max(now, known ?? now);
}

const standingRank = (s: Standing) => STANDINGS.indexOf(s);

function rememberStandings(known: Map<string, Standing> | undefined, now: CharacterState['reputation']) {
  if (!now) return known;
  const best = new Map(known);
  for (const { faction, standing } of now) {
    const before = best.get(faction);
    if (!before || standingRank(standing) > standingRank(before)) best.set(faction, standing);
  }
  return best;
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
        const items = now.gear?.filter((i) => i.quality === first);
        found.push({ ...who, kind: 'gear', quality: first, text: `${player} equipped their first ${first} item`, ...(items?.length ? { items } : {}) });
      }
    }
  }

  if (before.bestHonorRank !== undefined && now.honorRank != null) {
    for (let rank = before.bestHonorRank + 1; rank <= now.honorRank; rank++) {
      found.push({ ...who, kind: 'honor-rank', rank, text: `${player} reached honor rank ${rank}` });
    }
  }

  // A faction first met already at Honored (e.g. between two polls) counts from nothing, like a new profession.
  if (before.bestStandings && now.reputation) {
    for (const { faction, standing } of now.reputation) {
      const bestBefore = before.bestStandings.get(faction);
      for (const tier of STANDING_MILESTONES) {
        if (standingRank(standing) >= standingRank(tier) && (!bestBefore || standingRank(bestBefore) < standingRank(tier))) {
          found.push({ ...who, kind: 'reputation', faction, standing: tier, text: `${player} reached ${tier} with ${faction}` });
        }
      }
    }
  }

  const firsts = [
    { kind: 'dungeon-achievement', before: before.bestDungeons, now: now.achievements?.dungeons, text: 'earned their first dungeon achievement' },
    { kind: 'raid-achievement', before: before.bestRaids, now: now.achievements?.raids, text: 'earned their first raid achievement' },
    { kind: 'mount', before: before.bestMounts, now: now.mounts, text: 'got their first mount' },
  ] as const;
  for (const first of firsts) {
    if (first.before === 0 && first.now != null && first.now > 0) {
      const mounts = first.kind === 'mount' && now.collectedMounts ? { mounts: now.collectedMounts } : {};
      found.push({ ...who, kind: first.kind, text: `${player} ${first.text}`, ...mounts });
    }
  }

  return found;
}
