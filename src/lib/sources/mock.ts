// Mock source: produces raw Battle.net-shaped responses (CharacterProfileSummary),
// so the same normalize() path runs as with the real API. Deterministic per
// character name and point in time, so seeded history and later polls agree.

import type { CharacterProfileSummary, NamedRef } from '../blizzard/types.ts';
import { MAX_LEVEL, STANDINGS, XP_TO_NEXT_LEVEL, normalize, type CharacterState, type RosterEntry, type Standing } from '../model.ts';
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
  { id: 2, name: 'Orc', classes: [1, 3, 4, 7, 9], home: 'Orgrimmar' },
  { id: 5, name: 'Undead', classes: [1, 4, 5, 8, 9], home: 'Undercity' },
  { id: 6, name: 'Tauren', classes: [1, 3, 7, 11], home: 'Thunder Bluff' },
  { id: 8, name: 'Troll', classes: [1, 3, 4, 5, 7, 8], home: 'Darkspear Trolls' },
];
const HORDE_FACTIONS = ['Darkspear Trolls', 'Orgrimmar', 'Thunder Bluff', 'Undercity'];
const NEUTRAL_FACTIONS = ['Booty Bay', 'Gadgetzan', 'Ratchet'];

const mockRace = (name: string) => RACES[Math.floor(hash(name + ':race') * RACES.length)];
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
  const race = mockRace(entry.name);
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

/**
 * The armory sub-page summaries, in the same shape the armory source stores them, improving with level: home city
 * Honored in the twenties and Exalted for a few by 60, a first dungeon achievement in the late teens or twenties,
 * a mount from 40, and a first raid achievement for some at 60.
 */
function mockSubPages(name: string, level: number): Pick<CharacterState, 'reputation' | 'achievements' | 'mounts'> {
  const home = mockRace(name).home;
  /** The standing reached by `level`, climbing one tier at each level in `at`. */
  const standing = (from: Standing, at: number[]): Standing =>
    STANDINGS[STANDINGS.indexOf(from) + at.filter((l) => level >= l).length];
  const reputation = [
    ...HORDE_FACTIONS.map((faction) => {
      const offset = Math.floor(hash(`${name}:${faction}`) * 10);
      return {
        faction,
        standing: faction === home ? standing('Friendly', [20 + offset, 38 + offset, 52 + offset]) : standing('Neutral', [12 + offset, 34 + offset]),
      };
    }),
    ...NEUTRAL_FACTIONS.map((faction) => ({ faction, standing: standing('Neutral', [40 + Math.floor(hash(`${name}:${faction}`) * 15)]) })),
  ];
  const dungeonsFrom = 17 + Math.floor(hash(name + ':dungeons') * 8);
  const dungeons = level < dungeonsFrom ? 0 : Math.min(6, 1 + Math.floor((level - dungeonsFrom) / 8));
  const raids = level >= MAX_LEVEL && hash(name + ':raids') > 0.5 ? 1 : 0;
  const mounts = level >= 40 + Math.floor(hash(name + ':mount') * 4) ? 1 : 0;
  return { reputation, achievements: { dungeons, raids }, mounts };
}

export const mockSource: CharacterSource = {
  kind: 'mock',
  async fetchCharacter(entry, at) {
    const state = normalize(entry, mockProfile(entry, at), null);
    return { character: { ...state, ...mockGearAndHonor(entry.name, state.level), ...mockSubPages(entry.name, state.level) } };
  },
};
