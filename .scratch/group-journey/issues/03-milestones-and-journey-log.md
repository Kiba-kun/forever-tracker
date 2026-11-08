# 03: Milestone engine and Journey log, using data already stored

Parent spec: `.scratch/group-journey/spec.md` (see "Milestone rules"). Terms: `CONTEXT.md`.

**What to build:** A **Journey log** section tells the Group's story: Personal and Group Milestones, newest first, each dated, latest 20 shown with a way to see them all. Group Milestones are also marked on the Journey chart. This ticket covers every Milestone that can be detected from fields already stored today. The first sighting of anything is a quiet Baseline, so shipping this produces no flood of fake entries.

**Blocked by:** 02 (Levels earned together and the Journey chart).

**Status:** ready-for-agent

- [ ] Milestones are derived from the stored snapshot history inside the dashboard builder and recomputed on every build. Nothing new is persisted.
- [ ] Each Milestone has the time of the snapshot that first showed the change, a kind, and the Player and Main for Personal Milestones.
- [ ] Baseline rules, each tested through the dashboard builder:
  - The first non-null value per Player per field is a Baseline.
  - Changes are compared against the last known value.
  - `null` never creates a Milestone and never replaces the last known value.
  - A Main switch resets that Player's Baselines.
  - A Group Milestone already true in the first snapshot that can evaluate it is a Baseline.
- [ ] Personal Milestones, each tested:
  - level 10/20/30/40/50/60 crossed (a multi-threshold jump between two polls produces each one)
  - spec chosen from none, or changed
  - a profession's skill cap reaching the Journeyman (150), Expert (225) or Artisan (300) tier
- [ ] Group Milestones, each tested:
  - Levels earned together crossing each multiple of 100
  - every current Main at or above 20/30/40/50/60
- [ ] The Journey log section renders the Milestones newest first: 20 shown, the rest behind "show all". Personal entries read Player first (e.g. "Max reached level 40"). Reaching 60 reads like any other Milestone, not as "finished".
- [ ] Group Milestones appear as markers on the Journey chart.
- [ ] A friendly empty state shows when there are no Milestones yet.
- [ ] `seed:mock` history produces a believable log. Checked in the browser preview.
