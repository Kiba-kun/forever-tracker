import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CharacterState, RosterEntry, Snapshot } from './model.ts';
import { namePlayers } from './store.ts';

const roster: RosterEntry[] = [{ name: 'Wheredem Hosat', player: 'Max', ruleset: 'pvp' }];
const record = (name: string, player?: string) => ({ name, player, level: 12 }) as CharacterState;

describe('namePlayers', () => {
  it('names the Player on stored records that lack one, from the roster, so a later reroll keeps their history', () => {
    const history: Snapshot[] = [
      { takenAt: 1, source: 'armory', errors: [], characters: [record('Wheredem Hosat'), record('Gone Alt'), record('Other', 'Vlad')] },
    ];
    const { snapshots, named } = namePlayers(history, roster);
    assert.deepEqual(snapshots[0].characters.map((c) => c.player), ['Max', undefined, 'Vlad']);
    assert.equal(named, 1);
  });
});
