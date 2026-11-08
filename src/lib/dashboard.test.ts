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

/** Max rerolls: Wheredem Hosat is replaced by Fresh Start in the roster. */
const afterMaxRerolls: RosterEntry[] = roster.map((r) => (r.player === 'Max' ? { ...r, name: 'Fresh Start' } : r));

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

  it('counts Levels earned together: every level the Group gained since level 1', () => {
    const data = buildDashboard(
      [snapshot(T0, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 20), main('Wheredem Hosat', 30)])],
      roster,
    );
    assert.equal(data.levelsTogether, 57);
  });

  it('keeps a rerolled Main\'s levels in Levels earned together, even in records that never named a Player', () => {
    // Records polled before Players were required carry no `player`, like the real history from 2026-11-08.
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 20), main('Wheredem Hosat', 30, { player: undefined })]),
        snapshot(T0 + HOUR, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 20), main('Fresh Start', 3, { player: 'Max' })]),
      ],
      afterMaxRerolls,
    );
    assert.equal(data.levelsTogether, 9 + 19 + 29 + 2);
    assert.deepEqual(data.characters.map((c) => c.name), ['Horizontally Blessed', 'Ignatius Perdun', 'Fresh Start']);
  });

  it('keeps the levels of a Player who left the Group, so Levels earned together never drops', () => {
    const withoutMax = roster.filter((r) => r.player !== 'Max');
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 20), main('Wheredem Hosat', 30)]),
        snapshot(T0 + HOUR, [main('Horizontally Blessed', 11), main('Ignatius Perdun', 20)]),
      ],
      withoutMax,
    );
    assert.equal(data.levelsTogether, 10 + 19 + 29);
  });

  it('keeps a Main\'s last known level when one poll fails to fetch them', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 20), main('Wheredem Hosat', 30)]),
        { ...snapshot(T0 + HOUR, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 21)]), errors: [{ name: 'Wheredem Hosat', message: 'armory 503' }] },
      ],
      roster,
    );
    assert.deepEqual(data.journey.map((p) => p.levelsTogether), [57, 58]);
  });

  it('aims at the next hundred Levels earned together as the next Group Milestone', () => {
    const at = (...levels: number[]) =>
      buildDashboard([snapshot(T0, roster.map((r, i) => main(r.name, levels[i])))], roster).nextGroupMilestone;
    assert.deepEqual(at(10, 20, 30), { target: 100, remaining: 43 });
    // Exactly on a hundred: that one is reached, so aim at the next.
    assert.deepEqual(at(34, 34, 35), { target: 200, remaining: 100 });
  });

  it('draws the Journey as one Group line of Levels earned together, one point per snapshot', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 10), main('Ignatius Perdun', 20), main('Wheredem Hosat', 30)]),
        snapshot(T0 + HOUR, [main('Horizontally Blessed', 12), main('Ignatius Perdun', 20), main('Wheredem Hosat', 30)]),
        snapshot(T0 + 2 * HOUR, [main('Horizontally Blessed', 12), main('Ignatius Perdun', 20), main('Fresh Start', 1, { player: 'Max' })]),
      ],
      afterMaxRerolls,
    );
    assert.deepEqual(data.journey, [
      { t: T0, levelsTogether: 57 },
      { t: T0 + HOUR, levelsTogether: 59 },
      { t: T0 + 2 * HOUR, levelsTogether: 59 },
    ]);
    assert.ok(!('avgLevel' in data.stats), 'no Group average: Levels earned together replaces it');
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
