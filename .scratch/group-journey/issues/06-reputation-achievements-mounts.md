# 06: Reputation, achievements and mounts from the armory sub-pages

Parent spec: `.scratch/group-journey/spec.md` (see "New character fields" and "Milestone rules"). Terms: `CONTEXT.md`.

**What to build:** The Journey log celebrates:
- reputation reaching Honored, Revered or Exalted
- a Main's first dungeon achievement and first raid achievement
- a Main's first mount
- for the Group: the first dungeon achievement, and every Main having a mount

The poller fetches each Main's reputation, achievements and mounts armory sub-pages. A sub-page that fails never stops the Main's level from updating.

**Blocked by:** 05 (Gear quality and honor rank).

**Status:** done

- [x] The stored character data gains nullable summaries:
  - reputation as a list of `{ faction, standing tier }`, tier only, no points
  - completed achievement counts for the Dungeons and Raids categories
  - mounts collected (a count)
- [x] Each Main takes the main page plus three sub-page requests per poll.
  - A main-page failure fails the Main, as today.
  - A sub-page failure only sets that field to `null` and is reported in the poll output.
- [x] Armory parsing tests use the reputation, achievements and mounts captures in `.scratch/group-journey/fixtures/`. They check the extracted summaries, and that a missing or garbled sub-page yields `null`.
- [x] Personal Milestones, tested through the dashboard builder with Baseline and `null` rules:
  - a reputation standing rising to Honored, Revered or Exalted
  - Dungeons count going from 0 to more than 0
  - Raids count going from 0 to more than 0
  - mounts going from 0 to more than 0
- [x] Group Milestones, tested: the first dungeon achievement by any Main; every current Main having a mount.
- [x] A poll with no meaningful change is still not saved, because grinding inside a reputation tier doesn't change the stored data.
- [x] The mock source generates the new summaries.
- [x] After a real armory poll, the first run is quiet (Baselines only). Checked locally.

**As built:** reputation is stored by tier name (from the armory's `standingType.enum`) in page order. Like gear and honor rank, every rule compares against the best ever seen: a standing lost and regained is quiet, and a jump past several tiers between polls marks each one. A faction first seen already at Honored or above is marked, the same way a newly learned profession counts from nothing. Group firsts (first dungeon achievement, every Main mounted) are judged only once every current Main's value is known; after that they are announced only in a snapshot where a Main's own first of the same kind makes them true. Becoming true any other way (a Player switching to a Main that already had it, or leaving the Group) is a quiet Baseline. Sub-page problems are printed by the poller but not stored. A sub-page that fails stores `null`, so that poll and the next good one are both saved (accepted: `null` means unknown, and the history stays honest). Checked locally on 2026-11-08: a real armory poll read all three sub-pages for all 6 Mains with no problems and produced no Milestones.
