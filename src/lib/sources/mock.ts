// Mock source: produces raw Battle.net-shaped responses (CharacterProfileSummary),
// so the same normalize() path runs as with the real API. Deterministic per
// character name and point in time, so seeded history and later polls agree.

import type { CharacterProfileSummary, NamedRef } from '../blizzard/types.ts';
import { MAX_LEVEL, XP_TO_NEXT_LEVEL, normalize, type CharacterState, type RosterEntry } from '../model.ts';
import type { CharacterSource } from './types.ts';

/** WoW Forever global launch: 2026-11-04 15:00 PST. */
export const LAUNCH_AT = Date.UTC(2026, 10, 4, 23, 0, 0);

const HOUR = 3_600_000;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

const ref = (kind: string, id: number, name: string): NamedRef => ({
  key: { href: `https://eu.api.blizzard.com/data/wow/${kind}/${id}?namespace=static-forever-eu` },
  id,
  name,
});

// Horde race → class combinations available in the original game.
const RACES = [
  { id: 2, name: 'Orc', classes: [1, 3, 4, 7, 9] },
  { id: 5, name: 'Undead', classes: [1, 4, 5, 8, 9] },
  { id: 6, name: 'Tauren', classes: [1, 3, 7, 11] },
  { id: 8, name: 'Troll', classes: [1, 3, 4, 5, 7, 8] },
];
const CLASSES: Record<number, string> = {
  1: 'Warrior', 3: 'Hunter', 4: 'Rogue', 5: 'Priest', 7: 'Shaman', 8: 'Mage', 9: 'Warlock', 11: 'Druid',
};

/** Chance a character is online during a given UTC hour (evening-heavy, weekends busier). */
function onlineChance(t: number, name: string) {
  const d = new Date(t);
  const h = (d.getUTCHours() + 1) % 24; // ~CET
  const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
  const base = h >= 18 && h <= 23 ? 0.75 : h >= 12 ? 0.3 : h >= 8 ? 0.1 : 0.03;
  const dedication = 0.55 + hash(name + ':dedication') * 0.75;
  return Math.min(base * dedication * (weekend ? 1.4 : 1), 0.95);
}

function simulate(name: string, at: number) {
  const skill = 0.75 + hash(name + ':skill') * 0.6;
  let level = 1;
  let xp = 0;
  let lastLogin = LAUNCH_AT;
  for (let t = LAUNCH_AT; t + HOUR <= at && level < MAX_LEVEL; t += HOUR) {
    if (hash(`${name}:${t}`) > onlineChance(t, name)) continue;
    lastLogin = t + HOUR;
    xp += (5200 + level * 1100) * skill;
    while (level < MAX_LEVEL && xp >= XP_TO_NEXT_LEVEL[level - 1]) {
      xp -= XP_TO_NEXT_LEVEL[level - 1];
      level++;
    }
  }
  if (level >= MAX_LEVEL) xp = 0;
  return { level, xp: Math.floor(xp), lastLogin };
}

export function mockProfile(entry: RosterEntry, at: number): CharacterProfileSummary {
  const race = RACES[Math.floor(hash(entry.name + ':race') * RACES.length)];
  const classId = race.classes[Math.floor(hash(entry.name + ':spec') * race.classes.length)];
  const { level, xp, lastLogin } = simulate(entry.name, at);
  const id = Math.floor(hash(entry.name) * 1e8);
  return {
    _links: { self: { href: `https://eu.api.blizzard.com/profile/wow/character/1/${entry.name}` } },
    id,
    name: entry.name,
    gender: hash(entry.name + ':g') > 0.5 ? { type: 'MALE', name: 'Male' } : { type: 'FEMALE', name: 'Female' },
    faction: { type: 'HORDE', name: 'Horde' },
    race: ref('playable-race', race.id, race.name),
    character_class: ref('playable-class', classId, CLASSES[classId]),
    guild: { ...ref('guild', 1, 'Eight Pack'), realm: undefined },
    level,
    experience: xp,
    last_login_timestamp: lastLogin,
    equipped_item_level: Math.max(1, Math.round(level * 0.9 + hash(entry.name + ':il') * 4)),
    is_ghost: false,
  };
}

/**
 * The armory-only summaries, in the same shape the armory source stores them. They only ever improve with level,
 * so seeded history tells a believable story: a first Rare in the teens or twenties, a first Epic near 60, and
 * honor ranks for the Mains who like PvP once they're past 30.
 */
function mockGearAndHonor(name: string, level: number): Pick<CharacterState, 'gearQuality' | 'honorRank'> {
  const rareAt = 14 + Math.floor(hash(name + ':rare') * 12);
  const epicAt = 48 + Math.floor(hash(name + ':epic') * 12);
  const gearQuality = level >= epicAt ? 'Epic' : level >= rareAt ? 'Rare' : level >= 6 ? 'Uncommon' : 'Common';
  const pvp = hash(name + ':pvp');
  const honorRank = level <= 30 || pvp < 0.3 ? 0 : Math.min(14, Math.floor(((level - 30) / 4) * pvp));
  return { gearQuality, honorRank };
}

export const mockSource: CharacterSource = {
  kind: 'mock',
  async fetchCharacter(entry, at) {
    const state = normalize(entry, mockProfile(entry, at), null);
    return { ...state, ...mockGearAndHonor(entry.name, state.level) };
  },
};
