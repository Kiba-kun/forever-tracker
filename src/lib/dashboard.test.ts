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

describe('Milestones', () => {
  const texts = (data: ReturnType<typeof buildDashboard>) => data.milestones.map((m) => m.text);

  it('stays quiet on the first sighting: what a Main already had is a Baseline', () => {
    const data = buildDashboard([snapshot(T0, [main('Horizontally Blessed', 25), main('Ignatius Perdun', 40)])], roster);
    assert.deepEqual(texts(data), []);
  });

  it('marks a Main reaching level 20 as a Personal Milestone, told with the Player first', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 19)]),
        snapshot(T0 + HOUR, [main('Horizontally Blessed', 20)]),
      ],
      roster,
    );
    assert.deepEqual(data.milestones, [
      { at: T0 + HOUR, kind: 'level', player: 'Andrii', character: 'Horizontally Blessed', level: 20, text: 'Andrii reached level 20' },
    ]);
  });

  it('marks every threshold a Main jumped past between two polls', () => {
    const data = buildDashboard(
      [snapshot(T0, [main('Ignatius Perdun', 18)]), snapshot(T0 + HOUR, [main('Ignatius Perdun', 31)])],
      roster,
    );
    assert.deepEqual(texts(data), ['Vlad reached level 30', 'Vlad reached level 20']);
  });

  it('starts a rerolled Main from a Baseline, even when the old Main\'s records never named a Player', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Wheredem Hosat', 30, { player: undefined })]),
        snapshot(T0 + HOUR, [main('Fresh Start', 9, { player: 'Max' })]),
        snapshot(T0 + 2 * HOUR, [main('Fresh Start', 10, { player: 'Max' })]),
      ],
      afterMaxRerolls,
    );
    assert.deepEqual(data.milestones.map((m) => [m.text, 'character' in m && m.character]), [['Max reached level 10', 'Fresh Start']]);
  });

  it('learns whose Main a Character is from any record that names the Player', () => {
    // Wheredem Hosat has left the roster; only a later record says it was Max's.
    const data = buildDashboard(
      [
        snapshot(T0, [main('Wheredem Hosat', 9, { player: undefined })]),
        snapshot(T0 + HOUR, [main('Wheredem Hosat', 10, { player: 'Max' })]),
      ],
      afterMaxRerolls,
    );
    assert.deepEqual(texts(data), ['Max reached level 10']);
  });

  it('announces nothing when a Player switches to a Main that is already further along', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Wheredem Hosat', 12)]),
        snapshot(T0 + HOUR, [main('Fresh Start', 35, { player: 'Max' })]),
      ],
      afterMaxRerolls,
    );
    assert.deepEqual(texts(data), []);
  });

  it('marks a Main choosing a talent spec, and later switching it', () => {
    const vlad = (level: number, spec: string | null) => main('Ignatius Perdun', level, { spec });
    const data = buildDashboard(
      [snapshot(T0, [vlad(9, null)]), snapshot(T0 + HOUR, [vlad(11, 'Affliction')]), snapshot(T0 + 2 * HOUR, [vlad(12, 'Destruction')])],
      roster,
    );
    assert.deepEqual(texts(data), ['Vlad switched to Destruction Warlock', 'Vlad chose Affliction Warlock', 'Vlad reached level 10']);
  });

  it('treats a value the armory did not report as unknown: a Baseline when it first shows up, never a reset', () => {
    const vlad = (spec?: string | null) => main('Ignatius Perdun', 20, spec === undefined ? {} : { spec });
    const data = buildDashboard(
      [
        snapshot(T0, [vlad()]), // spec not reported yet (e.g. older data)
        snapshot(T0 + HOUR, [vlad('Affliction')]), // first known value: Baseline
        snapshot(T0 + 2 * HOUR, [vlad()]), // unknown again: nothing
        snapshot(T0 + 3 * HOUR, [vlad('Affliction')]), // same as last known: nothing
      ],
      roster,
    );
    assert.deepEqual(texts(data), []);
  });

  it('marks a profession reaching a new tier, but not learning a profession at Apprentice', () => {
    const prof = (name: string, max: number) => ({ name, skill: max - 10, max, primary: true });
    const vlad = (professions?: ReturnType<typeof prof>[]) =>
      main('Ignatius Perdun', 20, professions ? { professions } : {});
    const data = buildDashboard(
      [
        snapshot(T0, [vlad()]), // professions not reported yet
        snapshot(T0 + HOUR, [vlad([prof('Blacksmithing', 75)])]), // Baseline
        snapshot(T0 + 2 * HOUR, [vlad([prof('Blacksmithing', 150), prof('Mining', 75)])]),
        snapshot(T0 + 3 * HOUR, [vlad()]), // unknown again: nothing
        snapshot(T0 + 4 * HOUR, [vlad([prof('Blacksmithing', 300), prof('Mining', 75)])]),
      ],
      roster,
    );
    assert.deepEqual(texts(data), [
      'Vlad reached Artisan in Blacksmithing',
      'Vlad reached Expert in Blacksmithing',
      'Vlad reached Journeyman in Blacksmithing',
    ]);
  });

  it('marks the Group passing each hundred Levels earned together, but not hundreds already passed', () => {
    const group = (a: number, b: number, c: number) =>
      [main('Horizontally Blessed', a), main('Ignatius Perdun', b), main('Wheredem Hosat', c)];
    const data = buildDashboard(
      [snapshot(T0, group(40, 40, 40)), snapshot(T0 + HOUR, group(40, 41, 45))], // 117 -> 123: no hundred crossed
      roster,
    );
    assert.deepEqual(data.milestones.filter((m) => m.kind === 'levels-together'), []);

    const crossing = buildDashboard(
      [snapshot(T0, group(30, 30, 35)), snapshot(T0 + HOUR, group(33, 30, 35))], // 92 -> 95
      roster,
    );
    assert.deepEqual(crossing.milestones, []);
    const passed = buildDashboard(
      [snapshot(T0, group(30, 30, 35)), snapshot(T0 + HOUR, group(36, 31, 37))], // 92 -> 101
      roster,
    );
    assert.deepEqual(
      passed.milestones.filter((m) => m.kind === 'levels-together'),
      [{ at: T0 + HOUR, kind: 'levels-together', levelsTogether: 100, text: 'The Group has earned 100 levels together' }],
    );
  });

  it('marks the whole Group reaching a level once every Main is there, but only from when all Mains are known', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 25), main('Ignatius Perdun', 22)]), // Max not seen yet: can't tell
        snapshot(T0 + HOUR, [main('Horizontally Blessed', 25), main('Ignatius Perdun', 22), main('Wheredem Hosat', 21)]), // Baseline: all past 20
        snapshot(T0 + 2 * HOUR, [main('Horizontally Blessed', 31), main('Ignatius Perdun', 30), main('Wheredem Hosat', 29)]),
        snapshot(T0 + 3 * HOUR, [main('Horizontally Blessed', 31), main('Ignatius Perdun', 30), main('Wheredem Hosat', 30)]),
      ],
      roster,
    );
    assert.deepEqual(
      data.milestones.filter((m) => m.kind === 'whole-group-level'),
      [{ at: T0 + 3 * HOUR, kind: 'whole-group-level', level: 30, text: 'The whole Group reached level 30' }],
    );
  });

  it('marks Group Milestones on the Journey line, and only Group Milestones', () => {
    const group = (a: number, b: number, c: number) =>
      [main('Horizontally Blessed', a), main('Ignatius Perdun', b), main('Wheredem Hosat', c)];
    const data = buildDashboard(
      [snapshot(T0, group(30, 30, 35)), snapshot(T0 + HOUR, group(36, 31, 37))], // 92 -> 101, no Personal Milestones
      roster,
    );
    assert.deepEqual(data.journeyMarkers, [
      { t: T0 + HOUR, levelsTogether: 101, text: 'The Group has earned 100 levels together' },
    ]);
  });

  it('does not count a newly added Main\'s first sighting towards a Group Milestone', () => {
    const data = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 40)]), // 39
        snapshot(T0 + HOUR, [main('Horizontally Blessed', 40), main('Ignatius Perdun', 62)]), // Vlad first seen: 39 + 61 = 100, a Baseline
        snapshot(T0 + 2 * HOUR, [main('Horizontally Blessed', 41), main('Ignatius Perdun', 62)]), // 101
      ],
      roster,
    );
    assert.deepEqual(data.milestones.filter((m) => m.kind === 'levels-together'), []);

    const earned = buildDashboard(
      [
        snapshot(T0, [main('Horizontally Blessed', 40)]),
        snapshot(T0 + HOUR, [main('Horizontally Blessed', 40), main('Ignatius Perdun', 50)]), // 39 + 49 = 88, Baseline
        snapshot(T0 + 2 * HOUR, [main('Horizontally Blessed', 52), main('Ignatius Perdun', 50)]), // 51 + 49 = 100, earned
      ],
      roster,
    );
    assert.deepEqual(earned.milestones.filter((m) => m.kind === 'levels-together').map((m) => m.text), ['The Group has earned 100 levels together']);
  });

  it('does not re-announce a spec after the armory briefly shows no spec', () => {
    const vlad = (spec: string | null) => main('Ignatius Perdun', 20, { spec });
    const data = buildDashboard(
      [snapshot(T0, [vlad('Affliction')]), snapshot(T0 + HOUR, [vlad(null)]), snapshot(T0 + 2 * HOUR, [vlad('Affliction')])],
      roster,
    );
    assert.deepEqual(texts(data), []);
  });

  it('does not re-announce a profession tier after the armory briefly shows no professions', () => {
    const vlad = (max?: number) => main('Ignatius Perdun', 20, { professions: max ? [{ name: 'Mining', skill: max - 5, max, primary: true }] : [] });
    const data = buildDashboard(
      [snapshot(T0, [vlad(150)]), snapshot(T0 + HOUR, [vlad()]), snapshot(T0 + 2 * HOUR, [vlad(150)])],
      roster,
    );
    assert.deepEqual(texts(data), []);
  });
});
