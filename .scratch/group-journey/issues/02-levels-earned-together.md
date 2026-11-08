# 02: Levels earned together and the Journey chart

Parent spec: `.scratch/group-journey/spec.md`. Terms: `CONTEXT.md`.

**What to build:** The page leads with the Group's shared total.
- **Levels earned together** replaces the Group average tile.
- A **Next Group Milestone** tile shows progress to the next multiple of 100 (e.g. "112 / 200 levels together").
- **The Journey chart**, one Group line of Levels earned together over time, replaces the race chart.

History is followed per Player, so a Player who rerolls (switches Main in the roster) keeps their past, and the Group total never drops.

**Blocked by:** 01 (No more ranking).

**Status:** done

- [x] Levels earned together = for every Main ever followed, (highest level seen − 1), summed. Covered by dashboard builder tests.
  - *As built:* "every Main ever followed" = every Character ever recorded. The poller only records roster Mains, so this needs no Player lookup, which matters because most records from 2026-11-08 carry no `player`.
- [x] The old Main's levels keep counting, so Levels earned together never decreases across a reroll, when a Player leaves the Group, or when a poll fails to fetch a Main (tested).
  - *Deferred to 03:* detecting a Main switch per Player isn't needed for the total. It's needed for Baselines, so ticket 03 owns it.
- [x] Older snapshots match records to Players through the current roster by Character name. Tested in 01 for the Group table; the total doesn't depend on it.
- [x] The next Group Milestone is the next multiple of 100 above the current total, exposed with the current value (tested, including exactly on a multiple).
- [x] The view model exposes the Journey chart series: one point per snapshot with Levels earned together. There are no per-Player series.
- [x] The page shows the Levels earned together tile, the Next Group Milestone tile, and the Journey chart in place of the old race chart. A friendly note shows when history is too short for a chart.
- [x] The Group average is gone from the view model and the page.
- [x] Checked in the browser preview with mock and armory data.
