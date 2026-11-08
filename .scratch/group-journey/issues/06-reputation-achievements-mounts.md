# 06: Reputation, achievements and mounts from the armory sub-pages

Parent spec: `.scratch/group-journey/spec.md` (see "New character fields" and "Milestone rules"). Terms: `CONTEXT.md`.

**What to build:** The Journey log celebrates:
- reputation reaching Honored, Revered or Exalted
- a Main's first dungeon achievement and first raid achievement
- a Main's first mount
- for the Group: the first dungeon achievement, and every Main having a mount

The poller fetches each Main's reputation, achievements and mounts armory sub-pages. A sub-page that fails never stops the Main's level from updating.

**Blocked by:** 05 (Gear quality and honor rank).

**Status:** ready-for-agent

- [ ] The stored character data gains nullable summaries:
  - reputation as a list of `{ faction, standing tier }`, tier only, no points
  - completed achievement counts for the Dungeons and Raids categories
  - mounts collected (a count)
- [ ] Each Main takes the main page plus three sub-page requests per poll.
  - A main-page failure fails the Main, as today.
  - A sub-page failure only sets that field to `null` and is reported in the poll output.
- [ ] Armory parsing tests use the reputation, achievements and mounts captures in `.scratch/group-journey/fixtures/`. They check the extracted summaries, and that a missing or garbled sub-page yields `null`.
- [ ] Personal Milestones, tested through the dashboard builder with Baseline and `null` rules:
  - a reputation standing rising to Honored, Revered or Exalted
  - Dungeons count going from 0 to more than 0
  - Raids count going from 0 to more than 0
  - mounts going from 0 to more than 0
- [ ] Group Milestones, tested: the first dungeon achievement by any Main; every current Main having a mount.
- [ ] A poll with no meaningful change is still not saved, because grinding inside a reputation tier doesn't change the stored data.
- [ ] The mock source generates the new summaries.
- [ ] After a real armory poll, the first run is quiet (Baselines only). Checked locally.
