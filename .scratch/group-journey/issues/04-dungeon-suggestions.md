# 04: Dungeon suggestions

Parent spec: `.scratch/group-journey/spec.md` (see "Dungeon suggestions"). Terms: `CONTEXT.md`.

**What to build:** A **Dungeon suggestions** section helps the Group play together. It lists every original-era dungeon whose recommended level range includes at least two Mains' current levels, with the range and who fits (Player first, roster order). It's an invitation, never a judgement: no "behind" language. When no dungeon fits two Mains, a short friendly note shows instead.

**Blocked by:** 01 (No more ranking).

**Status:** ready-for-agent

- [ ] A fixed table of original-era dungeons with recommended level ranges, from Ragefire Chasm through the level-60 dungeons. The Scarlet Monastery and Dire Maul wings are listed separately.
- [ ] The dashboard builder exposes Dungeon suggestions:
  - only dungeons that include 2 or more Mains
  - ordered by level range
  - Mains in roster order
- [ ] Tests cover: two Mains in range → suggested; one Main in range → left out; range edges are inclusive; no matches → empty list.
- [ ] The page renders the section with dungeon name, range and the fitting Players and Mains, plus the empty-state note.
- [ ] Checked in the browser preview with mock data.
