// App-side domain model. Everything the UI reads is shaped here, so the raw
// Blizzard contract can change without touching components.

import type { CharacterMediaSummary, CharacterProfileSummary, FactionType } from './blizzard/types.ts';

export type RulesetKey = 'pvp' | 'normal' | 'roleplay' | 'roleplay-pvp';

/** IDs from GET /data/wow/ruleset/index on dynamic-forever-eu (checked 2026-11-08). */
export const RULESET_IDS: Record<RulesetKey, number> = { pvp: 1, normal: 2, roleplay: 3, 'roleplay-pvp': 15 };

export interface RosterEntry {
  /** The Main's Forever "First Last" name. */
  name: string;
  /** The Player this Main belongs to. Required: the Group is made of people. */
  player: string;
  ruleset: RulesetKey;
  /** Overrides the realm path segment once Blizzard's format for Forever is known. */
  realmSegment?: string;
}

/** Item quality, worst to best. */
export const GEAR_QUALITIES = ['Poor', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
export type GearQuality = (typeof GEAR_QUALITIES)[number];

/** The better of two qualities; an unknown one never wins. */
export function betterGear(a: GearQuality | null | undefined, b: GearQuality | null | undefined): GearQuality | undefined {
  if (!a || !b) return a ?? b ?? undefined;
  return GEAR_QUALITIES.indexOf(a) >= GEAR_QUALITIES.indexOf(b) ? a : b;
}

/** Reputation standing tiers, lowest to highest. */
export const STANDINGS = ['Hated', 'Hostile', 'Unfriendly', 'Neutral', 'Friendly', 'Honored', 'Revered', 'Exalted'] as const;
export type Standing = (typeof STANDINGS)[number];

/** An item a Main has equipped, as the armory shows it. `bonus` picks the random suffix ("of Stamina"). */
export interface EquippedItem {
  id: number;
  name: string;
  quality: GearQuality;
  /** Blizzard-hosted icon URL, shown from its own address. */
  icon: string | null;
  bonus?: number[];
}

/** A mount a Main has collected. Wowhead needs a spell id we don't have, so mounts get no link. */
export interface CollectedMount {
  name: string;
  quality: GearQuality;
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
  /** Best quality among equipped items (armory only). Missing or `null`: unknown, e.g. snapshots from before it was read. */
  gearQuality?: GearQuality | null;
  /** Equipped items in page slot order (armory only). Missing or `null`: unknown. */
  gear?: EquippedItem[] | null;
  /** PvP honor rank, 0 before the first rank (armory only). Missing or `null`: unknown. */
  honorRank?: number | null;
  /**
   * Standing tier with each faction, no points: grinding inside a tier changes nothing (armory reputation sub-page).
   * Missing or `null`: unknown, e.g. the sub-page failed to load.
   */
  reputation?: { faction: string; standing: Standing }[] | null;
  /** Completed achievements in the Dungeons and Raids categories (armory achievements sub-page). Missing or `null`: unknown. */
  achievements?: { dungeons: number; raids: number } | null;
  /** Mounts collected (armory mounts sub-page). Missing or `null`: unknown. */
  mounts?: number | null;
  /** Each collected mount's name and Quality (armory mounts sub-page). Missing or `null`: unknown. */
  collectedMounts?: CollectedMount[] | null;
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
