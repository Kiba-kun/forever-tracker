// GearScore: one number for a Main's equipped gear, following the formula of the
// community GearScore addon. Each item scores from its item level, Quality and slot;
// the Main's GearScore is the sum. Shown per Main by Group decision (docs/PRODUCT.md, principle 3).

import type { EquippedItem, GearQuality } from './model.ts';

/** How much each armory inventory type counts. Shirts, tabards, bags and ammo don't count. */
const SLOT_WEIGHT: Record<string, number> = {
  HEAD: 1, NECK: 0.5625, SHOULDER: 0.75, CHEST: 1, ROBE: 1, WAIST: 0.75, LEGS: 1, FEET: 0.75, WRIST: 0.5625,
  HAND: 0.75, FINGER: 0.5625, TRINKET: 0.5625, CLOAK: 0.5625,
  WEAPON: 1, SHIELD: 1, TWOHWEAPON: 2, WEAPONMAINHAND: 1, WEAPONOFFHAND: 1, HOLDABLE: 1,
  RANGED: 0.3164, RANGEDRIGHT: 0.3164, THROWN: 0.3164, RELIC: 0.3164,
};

const MELEE = new Set(['WEAPON', 'TWOHWEAPON', 'WEAPONMAINHAND', 'WEAPONOFFHAND']);
const RANGED = new Set(['RANGED', 'RANGEDRIGHT', 'THROWN']);

/** Hunters live by their bow: the addon swaps the weight of their melee and ranged weapons. */
const HUNTER_MELEE = 0.3164;
const HUNTER_RANGED = 5.3224;

/** Formula constants by Quality, as the addon uses them below item level 120 (every item in the original era). */
const CURVE: Partial<Record<GearQuality, { a: number; b: number }>> = {
  Uncommon: { a: 8, b: 2 },
  Rare: { a: 0.75, b: 1.8 },
  Epic: { a: 26, b: 1.2 },
  Legendary: { a: 26, b: 1.2 },
};
/** Formula constants above item level 120. */
const CURVE_HIGH: Partial<Record<GearQuality, { a: number; b: number }>> = {
  Uncommon: { a: 73, b: 1 },
  Rare: { a: 81.375, b: 0.8125 },
  Epic: { a: 91.45, b: 0.65 },
  Legendary: { a: 91.45, b: 0.65 },
};

const SCALE = 1.8618;

/** One item's score. Poor and Common items score almost nothing, as in the addon. */
export function itemScore(item: Required<Pick<EquippedItem, 'itemLevel' | 'slot' | 'quality'>>, className: string): number {
  let weight = SLOT_WEIGHT[item.slot];
  if (weight === undefined) return 0;
  if (className === 'Hunter') {
    if (MELEE.has(item.slot)) weight = HUNTER_MELEE;
    if (RANGED.has(item.slot)) weight = HUNTER_RANGED;
  }
  // Poor and Common use the Uncommon curve at a tiny fraction; Legendary is an Epic worth 30% more.
  const quality: GearQuality = item.quality === 'Poor' || item.quality === 'Common' ? 'Uncommon' : item.quality;
  const qualityScale = item.quality === 'Poor' || item.quality === 'Common' ? 0.005 : item.quality === 'Legendary' ? 1.3 : 1;
  const { a, b } = (item.itemLevel > 120 ? CURVE_HIGH : CURVE)[quality]!;
  return Math.max(0, Math.floor(((item.itemLevel - a) / b) * weight * SCALE * qualityScale));
}

/**
 * A Main's GearScore: the sum of its equipped items' scores. `null` when it can't be told:
 * gear unknown, or items read before the tracker stored their item level and slot.
 */
export function gearScore(gear: EquippedItem[] | null | undefined, className: string): number | null {
  if (!gear) return null;
  let total = 0;
  for (const { itemLevel, slot, quality } of gear) {
    if (itemLevel === undefined || slot === undefined) return null;
    total += itemScore({ itemLevel, slot, quality }, className);
  }
  return total;
}
