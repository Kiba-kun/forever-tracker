// Armory source: reads the character JSON that Blizzard's public armory page embeds
// (`var characterProfileInitialState = {...}`). Works while the official Profile API
// still 404s for EU Forever. It's an unofficial page format, so failures are loud and
// per-character, and the parser checks the fields it relies on.
//
// The armory refreshes a character when they log out, so data lags live play.

import { nameSlug } from '../blizzard/client.ts';
import type { FactionType } from '../blizzard/types.ts';
import { GEAR_QUALITIES, STANDINGS, betterGear, xpToNext, type CharacterState, type GearQuality, type RosterEntry, type Standing } from '../model.ts';
import type { CharacterSource } from './types.ts';

const MARKER = 'var characterProfileInitialState = ';

interface Enum {
  id: number;
  name: string;
  enum: string;
  slug: string;
}

interface ProfessionTier {
  name: string;
  skillPoints: number;
  maxSkillPoints: number;
}

/** The subset of the armory page's character object we use. */
export interface ArmoryCharacter {
  name: string;
  surname?: string;
  slug: string;
  level: number;
  averageItemLevel?: number;
  class: Enum;
  race: Enum;
  faction: Enum;
  gender?: Enum;
  ruleset?: { name: string; rulesetId: number; slug: string };
  avatar?: { url: string };
  lastUpdatedTimestamp?: { epoch: number; iso8601: string };
  guild?: { name: string } | null;
  specs?: { name: string; spentPoints?: number; active?: boolean }[];
  professions?: { primaries?: { name: string; tiers: ProfessionTier[] }[]; secondaries?: { name: string; tiers: ProfessionTier[] }[] };
  /** Equipped items by slot. */
  gear?: Record<string, { quality?: { type: string } }>;
  pvp?: { honorableKills?: { value: number }; rank?: { value: number } };
}

export function armoryUrl(entry: RosterEntry) {
  const region = process.env.BNET_REGION?.trim().toLowerCase() || 'eu';
  return `https://worldofwarcraft.blizzard.com/en-us/forever/${region}/armory/character/${nameSlug(entry.name)}/`;
}

/** The armory sub-pages read for each Main, by their path under the character's armory URL. */
const SUB_PAGES = { reputation: 'reputation', achievements: 'achievements', mounts: 'collections/mounts' } as const;
type SubPage = keyof typeof SUB_PAGES;

/** Each sub-page's HTML, or why it couldn't be fetched. */
export type ArmorySubPages = Record<SubPage, string | Error>;
type SubPageSummaries = Pick<CharacterState, SubPage>;

/** The page's embedded state object. */
function embeddedState(html: string): Record<string, unknown> {
  const start = html.indexOf(MARKER);
  if (start === -1) throw new Error('armory page has no character data (character missing or page format changed)');
  // The object is followed by ';' — find the end by matching braces outside strings.
  let i = start + MARKER.length;
  let depth = 0;
  let inString = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) break;
  }
  return JSON.parse(html.slice(start + MARKER.length, i + 1));
}

export function parseArmoryPage(html: string): ArmoryCharacter {
  const c = (embeddedState(html) as { character?: ArmoryCharacter }).character;
  if (!c || typeof c.level !== 'number' || !c.class?.name || !c.race?.name) {
    throw new Error('armory character data is missing level/class/race (page format changed?)');
  }
  return c;
}

export function armoryToState(entry: RosterEntry, c: ArmoryCharacter): CharacterState {
  // Talent points can be split across specs; the one with most points is "the" spec.
  const spec = [...(c.specs ?? [])].sort((a, b) => (b.spentPoints ?? 0) - (a.spentPoints ?? 0))[0];
  const professions = [...(c.professions?.primaries ?? []), ...(c.professions?.secondaries ?? [])].map((p) => ({
    name: p.name,
    skill: p.tiers[0]?.skillPoints ?? 0,
    max: p.tiers[0]?.maxSkillPoints ?? 0,
    primary: (c.professions?.primaries ?? []).includes(p),
  }));
  return {
    name: entry.name,
    player: entry.player,
    ruleset: entry.ruleset,
    level: c.level,
    xp: null, // the armory doesn't expose XP into the current level
    xpToNext: xpToNext(c.level),
    className: c.class.name,
    classId: c.class.id,
    race: c.race.name,
    faction: c.faction.enum as FactionType,
    guild: c.guild?.name ?? null,
    itemLevel: c.averageItemLevel ?? null,
    lastLogin: c.lastUpdatedTimestamp?.epoch ?? Date.now(),
    avatarUrl: c.avatar?.url ?? null,
    isGhost: false,
    spec: spec && (spec.spentPoints ?? 0) > 0 ? spec.name : null,
    professions,
    honorableKills: c.pvp?.honorableKills?.value ?? null,
    gearQuality: bestQuality(c.gear),
    honorRank: c.pvp?.rank?.value ?? null,
  };
}

/** Best quality among equipped items, or null when nothing equipped has a quality we know. */
function bestQuality(gear: ArmoryCharacter['gear']): GearQuality | null {
  let best: GearQuality | undefined;
  for (const item of Object.values(gear ?? {})) {
    best = betterGear(best, GEAR_QUALITIES.find((q) => q.toUpperCase() === item.quality?.type));
  }
  return best ?? null;
}

interface ReputationNode {
  name?: string;
  standingType?: { enum: string };
  reputations?: ReputationNode[];
}

/** Every faction's standing tier, in page order. Faction groups (e.g. "Alliance") only hold factions. */
function reputationSummary(html: string): NonNullable<CharacterState['reputation']> {
  const root = (embeddedState(html).reputations as ReputationNode | undefined)?.reputations;
  if (!Array.isArray(root)) throw new Error('no reputation list (page format changed?)');
  const found: NonNullable<CharacterState['reputation']> = [];
  const visit = (nodes: ReputationNode[]) => {
    for (const r of nodes) {
      if (r.standingType) {
        const standing = STANDINGS.find((s) => s.toUpperCase() === r.standingType?.enum);
        if (!r.name || !standing) throw new Error(`unknown standing "${r.standingType.enum}" with "${r.name}"`);
        found.push({ faction: r.name, standing });
      }
      if (Array.isArray(r.reputations)) visit(r.reputations);
    }
  };
  visit(root);
  return found;
}

function achievementsSummary(html: string): NonNullable<CharacterState['achievements']> {
  const categories = (embeddedState(html).achievementIndex as { categories?: { slug: string; count: unknown }[] } | undefined)?.categories;
  const count = (slug: string) => {
    const n = categories?.find((c) => c.slug === slug)?.count;
    if (typeof n !== 'number') throw new Error(`no ${slug} achievement count (page format changed?)`);
    return n;
  };
  return { dungeons: count('dungeons'), raids: count('raids') };
}

function mountsSummary(html: string): number {
  const n = (embeddedState(html).mounts as { mountsCollected?: unknown } | undefined)?.mountsCollected;
  if (typeof n !== 'number') throw new Error('no mounts collected count (page format changed?)');
  return n;
}

/**
 * The summaries read from the sub-pages. A sub-page that failed to load or can't be read leaves its summary
 * `null` (unknown) and is reported in `problems`; it never fails the Main.
 */
export function readSubPages(pages: ArmorySubPages): { summaries: SubPageSummaries; problems: string[] } {
  const problems: string[] = [];
  const read = <T>(page: SubPage, summarize: (html: string) => T): T | null => {
    const html = pages[page];
    try {
      if (html instanceof Error) throw html;
      return summarize(html);
    } catch (e) {
      problems.push(`${page}: ${(e as Error).message}`);
      return null;
    }
  };
  const summaries = {
    reputation: read('reputation', reputationSummary),
    achievements: read('achievements', achievementsSummary),
    mounts: read('mounts', mountsSummary),
  };
  return { summaries, problems };
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'forever-tracker/0.1 (private friends dashboard)', Accept: 'text/html' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`armory ${res.status} for ${url}`);
  return res.text();
}

export const armorySource: CharacterSource = {
  kind: 'armory',
  async fetchCharacter(entry) {
    const url = armoryUrl(entry);
    const subPage = (page: SubPage) =>
      fetchPage(url + SUB_PAGES[page]).catch((e: unknown) => (e instanceof Error ? e : new Error(String(e))));
    const pending = { reputation: subPage('reputation'), achievements: subPage('achievements'), mounts: subPage('mounts') };
    // The main page decides whether the Main loads at all; sub-pages only fill in their summaries.
    const character = armoryToState(entry, parseArmoryPage(await fetchPage(url)));
    const { summaries, problems } = readSubPages({
      reputation: await pending.reputation,
      achievements: await pending.achievements,
      mounts: await pending.mounts,
    });
    return { character: { ...character, ...summaries }, problems };
  },
};
