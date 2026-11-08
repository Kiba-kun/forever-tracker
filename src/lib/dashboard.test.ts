import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildDashboard } from './dashboard.ts';
import type { CharacterState, RosterEntry, Snapshot } from './model.ts';

const HOUR = 3_600_000;
const T0 = Date.UTC(2026, 10, 8, 12);

const roster: RosterEntry[] = [
  { name: 'Horizontally Blessed', player: 'Andrii', ruleset: 'pvp' },
  { name: 'Ignatius Perdun', player: 'Vlad', ruleset: 'pvp' },
  { name: 'Wheredem Hosat', player: 'Max', ruleset: 'pvp' },
];

function main(name: string, level: number, extra: Partial<CharacterState> = {}): CharacterState {
  const entry = roster.find((r) => r.name === name);
  return {
    name, player: entry?.player, ruleset: 'pvp', level, xp: null, xpToNext: null,
    className: 'Warlock', classId: 9, race: 'Human', faction: 'ALLIANCE', guild: null,
    itemLevel: null, lastLogin: T0, avatarUrl: null, isGhost: false, ...extra,
  };
}

function snapshot(at: number, characters: CharacterState[]): Snapshot {
  return { takenAt: at, source: 'armory', characters, errors: [] };
}

describe('buildDashboard', () => {
  it('lists Mains in roster order, whatever their levels', () => {
    const data = buildDashboard(
      [snapshot(T0, [main('Wheredem Hosat', 30), main('Horizontally Blessed', 12), main('Ignatius Perdun', 21)])],
      roster,
    );
    assert.deepEqual(data.characters.map((c) => c.player), ['Andrii', 'Vlad', 'Max']);
  });

  it('names each Main\'s Player from the roster, even in snapshots taken before Players were required', () => {
    const data = buildDashboard([snapshot(T0, [main('Ignatius Perdun', 21, { player: undefined })])], roster);
    assert.equal(data.characters[0].player, 'Vlad');
  });

  it('leaves out a Character that is no longer in the roster', () => {
    const data = buildDashboard(
      [snapshot(T0, [main('Ignatius Perdun', 21), main('Old Alt', 9, { player: 'Vlad' })])],
      roster,
    );
    assert.deepEqual(data.characters.map((c) => c.name), ['Ignatius Perdun']);
  });

  it('names no leader and shows no per-Main gains, only what the Group gained', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 20), main('Wheredem Hosat', 30)]),
        snapshot(T0 + 25 * HOUR, [main('Horizontally Blessed', 13), main('Ignatius Perdun', 21), main('Wheredem Hosat', 30)]),
      ],
      roster,
    );
    assert.equal(data.stats.groupGained24h, 4);
    assert.ok(!('leader' in data.stats), 'stats must not name a leader');
    for (const c of data.characters) assert.ok(!('gained24h' in c), `${c.name} must not carry a personal gain`);
  });
});
