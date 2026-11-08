// Dungeon suggestions: dungeons whose recommended level range currently includes at least two Mains of the same
// faction, so the Group can see who could play together tonight. An invitation, never a judgement (docs/PRODUCT.md).

import type { FactionType } from './blizzard/types.ts';
import type { CharacterState } from './model.ts';

interface Dungeon {
  name: string;
  minLevel: number;
  maxLevel: number;
  /** Set when the entrance is inside a faction's capital, so the other faction can't reach it. */
  capitalOf?: FactionType;
}

/**
 * Original-era dungeons with commonly cited recommended level ranges. Ranges are guidance, not rules;
 * adjust them here if the Group finds them off. Order doesn't matter: suggestions are sorted by range.
 */
const DUNGEONS: Dungeon[] = [
  { name: 'Ragefire Chasm', minLevel: 13, maxLevel: 18, capitalOf: 'HORDE' },
  { name: 'Wailing Caverns', minLevel: 15, maxLevel: 25 },
  { name: 'The Deadmines', minLevel: 17, maxLevel: 26 },
  { name: 'Shadowfang Keep', minLevel: 22, maxLevel: 30 },
  { name: 'The Stockade', minLevel: 22, maxLevel: 30, capitalOf: 'ALLIANCE' },
  { name: 'Blackfathom Deeps', minLevel: 24, maxLevel: 32 },
  { name: 'Scarlet Monastery: Graveyard', minLevel: 26, maxLevel: 36 },
  { name: 'Gnomeregan', minLevel: 29, maxLevel: 38 },
  { name: 'Razorfen Kraul', minLevel: 29, maxLevel: 38 },
  { name: 'Scarlet Monastery: Library', minLevel: 29, maxLevel: 39 },
  { name: 'Scarlet Monastery: Armory', minLevel: 32, maxLevel: 42 },
  { name: 'Scarlet Monastery: Cathedral', minLevel: 35, maxLevel: 45 },
  { name: 'Razorfen Downs', minLevel: 37, maxLevel: 46 },
  { name: 'Uldaman', minLevel: 41, maxLevel: 51 },
  { name: "Zul'Farrak", minLevel: 44, maxLevel: 54 },
  { name: 'Maraudon', minLevel: 46, maxLevel: 55 },
  { name: "Temple of Atal'Hakkar", minLevel: 50, maxLevel: 60 },
  { name: 'Blackrock Depths', minLevel: 52, maxLevel: 60 },
  { name: 'Dire Maul: East', minLevel: 55, maxLevel: 60 },
  { name: 'Lower Blackrock Spire', minLevel: 55, maxLevel: 60 },
  { name: 'Dire Maul: West', minLevel: 56, maxLevel: 60 },
  { name: 'Dire Maul: North', minLevel: 57, maxLevel: 60 },
  { name: 'Upper Blackrock Spire', minLevel: 58, maxLevel: 60 },
  { name: 'Scholomance', minLevel: 58, maxLevel: 60 },
  { name: 'Stratholme', minLevel: 58, maxLevel: 60 },
];

export type DungeonSuggestion = Omit<Dungeon, 'capitalOf'> & {
  /** Only Mains of one faction can group, so each suggestion is for one faction. */
  faction: FactionType;
  /** The Mains who fit, in roster order. */
  mains: { player: string; character: string }[];
};

/** @param mains The Group's current Mains, in roster order. */
export function dungeonSuggestions(
  mains: (Pick<CharacterState, 'name' | 'level' | 'faction'> & { player: string })[],
): DungeonSuggestion[] {
  const factions = [...new Set(mains.map((m) => m.faction))];
  return [...DUNGEONS]
    .sort((a, b) => a.minLevel - b.minLevel || a.maxLevel - b.maxLevel)
    .flatMap(({ capitalOf, ...dungeon }) =>
      factions
        .filter((faction) => !capitalOf || capitalOf === faction)
        .map((faction) => ({
          ...dungeon,
          faction,
          mains: mains
            .filter((m) => m.faction === faction && m.level >= dungeon.minLevel && m.level <= dungeon.maxLevel)
            .map((m) => ({ player: m.player, character: m.name })),
        }))
        .filter((s) => s.mains.length >= 2),
    );
}
