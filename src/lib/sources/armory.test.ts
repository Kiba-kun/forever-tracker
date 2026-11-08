import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import type { RosterEntry } from '../model.ts';
import { armoryToState, parseArmoryPage, readSubPages, type ArmorySubPages } from './armory.ts';

// Real armory captures from 2026-11-08: the JSON the main page embeds as `characterProfileInitialState`.
async function armoryPage(fixture: string) {
  const state = await readFile(new URL(`./fixtures/${fixture}.json`, import.meta.url), 'utf8');
  return `<html><script>var characterProfileInitialState = ${state};</script></html>`;
}

const andrii: RosterEntry = { name: 'Horizontally Blessed', player: 'Andrii', ruleset: 'pvp' };
const vlad: RosterEntry = { name: 'Ignatius Perdun', player: 'Vlad', ruleset: 'pvp' };

describe('armory main page to character state', () => {
  it('reads level, spec, professions, best gear quality and honor rank', async () => {
    const state = armoryToState(andrii, parseArmoryPage(await armoryPage('horizontally-blessed')));
    assert.equal(state.level, 16);
    assert.equal(state.spec, 'Feral Combat');
    assert.deepEqual(state.professions?.map((p) => [p.name, p.max, p.primary]), [
      ['Leatherworking', 75, true], ['Skinning', 150, true], ['Cooking', 75, false], ['Fishing', 75, false],
    ]);
    assert.equal(state.gearQuality, 'Rare');
    assert.equal(state.honorRank, 0);
  });

  it('finds the best quality among every equipped slot, including Poor and Common items', async () => {
    const state = armoryToState(vlad, parseArmoryPage(await armoryPage('ignatius-perdun')));
    assert.equal(state.level, 14);
    assert.equal(state.spec, 'Affliction');
    assert.deepEqual(state.professions?.map((p) => p.name), ['Tailoring', 'Enchanting']);
    assert.equal(state.gearQuality, 'Rare'); // the only Rare item is in the ranged slot
    assert.equal(state.honorRank, 0);
  });

  it('keeps every equipped item with its id, name, Quality, icon and bonus list', async () => {
    const state = armoryToState(andrii, parseArmoryPage(await armoryPage('horizontally-blessed')));
    assert.equal(state.gear?.length, 8);
    assert.deepEqual(state.gear?.find((i) => i.id === 9779), {
      id: 9779,
      name: 'Bandit Cloak of Stamina',
      quality: 'Uncommon',
      icon: 'https://render.worldofwarcraft.com/forever-eu/icons/56/133771.jpg',
      bonus: [12731],
    });
    assert.deepEqual(state.gear?.find((i) => i.id === 279895), {
      id: 279895,
      name: 'Ironforge Greathammer',
      quality: 'Rare',
      icon: 'https://render.worldofwarcraft.com/forever-eu/icons/56/133058.jpg',
    });
  });

  it('reports gear quality and honor rank as unknown when the page leaves them out', async () => {
    const page = JSON.parse((await armoryPage('ignatius-perdun')).match(/= (\{.*\});<\/script>/s)![1]);
    delete page.character.gear;
    delete page.character.pvp;
    const state = armoryToState(vlad, parseArmoryPage(`var characterProfileInitialState = ${JSON.stringify(page)};`));
    assert.equal(state.gearQuality, null);
    assert.equal(state.honorRank, null);
  });
});

// Real captures of Horizontally Blessed's reputation, achievements and mounts sub-pages from 2026-11-08.
async function subPages(): Promise<ArmorySubPages> {
  const [reputation, achievements, mounts] = await Promise.all(
    ['reputation', 'achievements', 'mounts'].map((page) => armoryPage(`horizontally-blessed.${page}`)),
  );
  return { reputation, achievements, mounts };
}

/** A sub-page with its embedded state changed by `edit`. */
async function editedPage(page: string, edit: (state: Record<string, any>) => void) {
  const state = JSON.parse(await readFile(new URL(`./fixtures/horizontally-blessed.${page}.json`, import.meta.url), 'utf8'));
  edit(state);
  return `var characterProfileInitialState = ${JSON.stringify(state)};`;
}

describe('armory sub-pages to character summaries', () => {
  it('reads every reputation standing as a tier, achievement counts for Dungeons and Raids, and mounts collected', async () => {
    const { summaries, problems } = readSubPages(await subPages());
    assert.deepEqual(summaries.reputation, [
      { faction: 'Gadgetzan', standing: 'Neutral' },
      { faction: 'Darnassus', standing: 'Honored' },
      { faction: 'Gnomeregan Exiles', standing: 'Friendly' },
      { faction: 'Ironforge', standing: 'Friendly' },
      { faction: 'Stormwind', standing: 'Friendly' },
    ]);
    assert.deepEqual(summaries.achievements, { dungeons: 0, raids: 0 });
    assert.equal(summaries.mounts, 0);
    assert.deepEqual(problems, []);
  });

  it('reads counts above zero', async () => {
    const pages = await subPages();
    pages.achievements = await editedPage('achievements', (s) => {
      for (const c of s.achievementIndex.categories) if (c.slug === 'dungeons') c.count = 2;
    });
    pages.mounts = await editedPage('mounts', (s) => { s.mounts.mountsCollected = 1; });
    const { summaries } = readSubPages(pages);
    assert.deepEqual(summaries.achievements, { dungeons: 2, raids: 0 });
    assert.equal(summaries.mounts, 1);
  });

  it('names each collected mount with its Quality, and only collected ones', async () => {
    const pages = await subPages();
    assert.deepEqual(readSubPages(pages).summaries.collectedMounts, []);
    pages.mounts = await editedPage('mounts', (s) => {
      s.mounts.mountsCollected = 1;
      s.mounts.mounts.find((m: { id: number }) => m.id === 77).collected = true;
    });
    assert.deepEqual(readSubPages(pages).summaries.collectedMounts, [{ name: 'Black Battlestrider', quality: 'Common' }]);
  });

  it('stores the same summary when reputation only grows inside a tier, so the poll is not saved', async () => {
    const before = readSubPages(await subPages()).summaries;
    const pages = await subPages();
    pages.reputation = await editedPage('reputation', (s) => {
      for (const group of s.reputations.reputations) for (const r of group.reputations) r.value += 100;
    });
    assert.deepEqual(readSubPages(pages).summaries, before);
  });

  it('leaves a sub-page that failed to load as unknown, and reports it', async () => {
    const pages: ArmorySubPages = { ...(await subPages()), mounts: new Error('armory 503') };
    const { summaries, problems } = readSubPages(pages);
    assert.equal(summaries.mounts, null);
    assert.deepEqual(summaries.achievements, { dungeons: 0, raids: 0 });
    assert.equal(summaries.reputation?.length, 5);
    assert.deepEqual(problems, ['mounts: armory 503']);
  });

  it('leaves a garbled sub-page as unknown, and reports it', async () => {
    const { summaries, problems } = readSubPages({
      reputation: '<html>maintenance</html>',
      achievements: await editedPage('achievements', (s) => { delete s.achievementIndex; }),
      mounts: await editedPage('mounts', (s) => { s.mounts.mountsCollected = 'lots'; }),
    });
    assert.deepEqual(summaries, { reputation: null, achievements: null, mounts: null, collectedMounts: null });
    assert.equal(problems.length, 3);
    assert.match(problems[0], /^reputation: /);
  });
});
