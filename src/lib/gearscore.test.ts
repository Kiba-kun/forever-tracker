import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { gearScore, itemScore } from './gearscore.ts';
import type { RosterEntry } from './model.ts';
import { armoryToState, parseArmoryPage } from './sources/armory.ts';

async function fixtureState(fixture: string, entry: RosterEntry) {
  const state = await readFile(new URL(`./sources/fixtures/${fixture}.json`, import.meta.url), 'utf8');
  return armoryToState(entry, parseArmoryPage(`var characterProfileInitialState = ${state};`));
}

describe('GearScore', () => {
  it('scores an item from its item level, Quality and slot', () => {
    // Uncommon cloak, item level 18: (18 - 8) / 2 * 0.5625 * 1.8618 = 5.2
    assert.equal(itemScore({ itemLevel: 18, slot: 'CLOAK', quality: 'Uncommon' }, 'Druid'), 5);
    // Rare two-hander counts double: (18 - 0.75) / 1.8 * 2 * 1.8618 = 35.7
    assert.equal(itemScore({ itemLevel: 18, slot: 'TWOHWEAPON', quality: 'Rare' }, 'Druid'), 35);
    // Epic above item level 120 uses the high curve: (130 - 91.45) / 0.65 * 1 * 1.8618 = 110.4
    assert.equal(itemScore({ itemLevel: 130, slot: 'CHEST', quality: 'Epic' }, 'Druid'), 110);
  });

  it('scores Poor and Common items almost nothing, and shirts not at all', () => {
    assert.equal(itemScore({ itemLevel: 13, slot: 'WRIST', quality: 'Common' }, 'Druid'), 0);
    assert.equal(itemScore({ itemLevel: 60, slot: 'HEAD', quality: 'Common' }, 'Druid'), 0);
    assert.equal(itemScore({ itemLevel: 20, slot: 'BODY', quality: 'Epic' }, 'Druid'), 0);
  });

  it('weighs a Hunter\'s ranged weapon far above their melee weapon', () => {
    const bow = { itemLevel: 20, slot: 'RANGED', quality: 'Rare' } as const;
    const axe = { itemLevel: 20, slot: 'TWOHWEAPON', quality: 'Rare' } as const;
    assert.ok(itemScore(bow, 'Hunter') > itemScore(bow, 'Warrior'));
    assert.ok(itemScore(axe, 'Hunter') < itemScore(axe, 'Warrior'));
  });

  it('adds up every equipped item of a real armory capture', async () => {
    const andrii = await fixtureState('horizontally-blessed', { name: 'Horizontally Blessed', player: 'Andrii', ruleset: 'pvp' });
    assert.equal(gearScore(andrii.gear, andrii.className), 84);
  });

  it('is unknown without gear, or for items read before item level and slot were stored', () => {
    assert.equal(gearScore(null, 'Druid'), null);
    assert.equal(gearScore([{ id: 1, name: 'Old Cloak', quality: 'Rare', icon: null }], 'Druid'), null);
    assert.equal(gearScore([], 'Druid'), 0);
  });
});
