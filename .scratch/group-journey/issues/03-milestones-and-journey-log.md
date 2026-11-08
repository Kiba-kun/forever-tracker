# 03: Milestone engine and Journey log, using data already stored

Parent spec: `.scratch/group-journey/spec.md` (see "Milestone rules"). Terms: `CONTEXT.md`.

**What to build:** A **Journey log** section tells the Group's story: Personal and Group Milestones, newest first, each dated, latest 20 shown with a way to see them all. Group Milestones are also marked on the Journey chart. This ticket covers every Milestone that can be detected from fields already stored today. The first sighting of anything is a quiet Baseline, so shipping this produces no flood of fake entries.

**Blocked by:** 02 (Levels earned together and the Journey chart).

**Status:** done

- [x] Milestones are derived from the stored snapshot history inside the dashboard builder and recomputed on every build. Nothing new is persisted.
- [x] Each Milestone has the time of the snapshot that first showed the change, a kind, and the Player and Main for Personal Milestones.
- [x] Main switches are detected per Player (the same Player, a different Character name than before; most records from 2026-11-08 have no `player`, so match through the roster, and remember attributions seen in later records). Tested with records that lack `player`.
- [x] Baseline rules, each tested through the dashboard builder:
  - The first non-null value per Player per field is a Baseline.
  - Changes are compared against the last known value.
  - `null` never creates a Milestone and never replaces the last known value.
  - A Main switch resets that Player's Baselines.
  - A Group Milestone already true in the first snapshot that can evaluate it is a Baseline.
- [x] Personal Milestones, each tested:
  - level 10/20/30/40/50/60 crossed (a multi-threshold jump between two polls produces each one)
  - spec chosen from none, or changed
  - a profession's skill cap reaching the Journeyman (150), Expert (225) or Artisan (300) tier
- [x] Group Milestones, each tested:
  - Levels earned together crossing each multiple of 100
  - every current Main at or above 20/30/40/50/60
- [x] The Journey log section renders the Milestones newest first: 20 shown, the rest behind "show all". Personal entries read Player first (e.g. "Max reached level 40"). Reaching 60 reads like any other Milestone, not as "finished".
- [x] Group Milestones appear as markers on the Journey chart.
- [x] A friendly empty state shows when there are no Milestones yet.
- [x] `seed:mock` history produces a believable log. Checked in the browser preview.

**As built (decisions made during review):**
- A Character's levels at first sighting don't count towards a Group Milestone for Levels earned together. A Main added to the roster later is a Baseline, not levels earned.
- For spec, `null` means "no spec chosen", a known value: `null` → spec is "chose". Once a spec is known, a later `null` doesn't replace it, so a glitch can't re-announce it. A real respec still shows up as "switched to".
- Profession caps keep the highest value seen per profession. An empty or partial professions list never replaces what was known.
- The poller names the Player on stored records that lack one, using the roster. That way a Main's history stays attributed after a later reroll. The 17 unnamed records from 2026-11-08 get named on the first poll after this ships.

