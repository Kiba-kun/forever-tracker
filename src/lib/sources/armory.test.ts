import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import type { RosterEntry } from '../model.ts';
import { armoryToState, parseArmoryPage } from './armory.ts';

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

  it('reports gear quality and honor rank as unknown when the page leaves them out', async () => {
    const page = JSON.parse((await armoryPage('ignatius-perdun')).match(/= (\{.*\});<\/script>/s)![1]);
    delete page.character.gear;
    delete page.character.pvp;
    const state = armoryToState(vlad, parseArmoryPage(`var characterProfileInitialState = ${JSON.stringify(page)};`));
    assert.equal(state.gearQuality, null);
    assert.equal(state.honorRank, null);
  });
});
