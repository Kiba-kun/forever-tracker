// App-side domain model. Everything the UI reads is shaped here, so the raw
// Blizzard contract can change without touching components.

import type { CharacterMediaSummary, CharacterProfileSummary, FactionType } from './blizzard/types.ts';

export type RulesetKey = 'pvp' | 'normal' | 'roleplay' | 'roleplay-pvp';

/** IDs from GET /data/wow/ruleset/index on dynamic-forever-eu (checked 2026-11-08). */
export const RULESET_IDS: Record<RulesetKey, number> = { pvp: 1, normal: 2, roleplay: 3, 'roleplay-pvp': 15 };

export interface RosterEntry {
  name: string;
  player?: string;
  ruleset: RulesetKey;
  /** Overrides the realm path segment once Blizzard's format for Forever is known. */
  realmSegment?: string;
}

export interface CharacterState {
  name: string;
  player?: string;
  ruleset: RulesetKey;
  level: number;
  /** XP into current level, when the API provides it. */
  xp: number | null;
  /** XP needed for the next level, null at max level. */
  xpToNext: number | null;
  className: string;
  classId: number;
  race: string;
  faction: FactionType;
  guild: string | null;
  itemLevel: number | null;
  lastLogin: number;
  avatarUrl: string | null;
  isGhost: boolean;
  /** Spec with the most talent points (armory only). */
  spec?: string | null;
  professions?: { name: string; skill: number; max: number; primary: boolean }[];
  honorableKills?: number | null;
}

export type SourceKind = 'mock' | 'blizzard' | 'armory';

export interface Snapshot {
  takenAt: number;
  source: SourceKind;
  characters: CharacterState[];
  errors: { name: string; message: string }[];
}

export const MAX_LEVEL = 60;

/** XP required to go from level N to N+1 (index 0 = level 1), Classic-era table. */
export const XP_TO_NEXT_LEVEL = [
  400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500, 7600, 8800, 10100, 11400, 12900, 14400, 16000, 17700,
  19400, 21300, 23200, 25200, 27300, 29400, 31700, 34000, 36400, 38900, 41400, 44300, 47400, 50800, 54500,
  58600, 62800, 67100, 71600, 76100, 80800, 85700, 90700, 95800, 101000, 106300, 111800, 117500, 123200,
  129100, 135100, 141200, 147500, 153900, 160400, 167100, 173900, 180800, 187900, 195000, 202300, 209800,
];

export function xpToNext(level: number): number | null {
  return level >= MAX_LEVEL ? null : XP_TO_NEXT_LEVEL[level - 1];
}

/** Level with fractional progress, e.g. 23.4 — handy for charts. */
export function fractionalLevel(c: Pick<CharacterState, 'level' | 'xp' | 'xpToNext'>) {
  if (c.xp == null || c.xpToNext == null) return c.level;
  return c.level + Math.min(c.xp / c.xpToNext, 0.999);
}

export function normalize(
  entry: RosterEntry,
  profile: CharacterProfileSummary,
  media: CharacterMediaSummary | null,
): CharacterState {
  const avatar = media?.assets?.find((a) => a.key === 'avatar')?.value ?? null;
  return {
    name: entry.name,
    player: entry.player,
    ruleset: entry.ruleset,
    level: profile.level,
    xp: profile.experience ?? null,
    xpToNext: xpToNext(profile.level),
    className: profile.character_class.name,
    classId: profile.character_class.id,
    race: profile.race.name,
    faction: profile.faction.type,
    guild: profile.guild?.name ?? null,
    itemLevel: profile.equipped_item_level ?? profile.average_item_level ?? null,
    lastLogin: profile.last_login_timestamp,
    avatarUrl: avatar,
    isGhost: profile.is_ghost ?? false,
  };
}
