# 02: Levels earned together and the Journey chart

Parent spec: `.scratch/group-journey/spec.md`. Terms: `CONTEXT.md`.

**What to build:** The page leads with the Group's shared total.
- **Levels earned together** replaces the Group average tile.
- A **Next Group Milestone** tile shows progress to the next multiple of 100 (e.g. "112 / 200 levels together").
- **The Journey chart**, one Group line of Levels earned together over time, replaces the race chart.

History is followed per Player, so a Player who rerolls (switches Main in the roster) keeps their past, and the Group total never drops.

**Blocked by:** 01 (No more ranking).

**Status:** ready-for-agent

- [ ] Levels earned together = for every Main ever followed, (last known level − 1), summed. Covered by dashboard builder tests.
- [ ] Switching Main is detected per Player: the same Player, a different Character name than in the previous snapshot. The old Main's levels keep counting, so Levels earned together never decreases across a reroll (tested).
- [ ] Older snapshots match records to Players through the current roster by Character name (tested).
- [ ] The next Group Milestone is the next multiple of 100 above the current total, exposed with the current value (tested, including exactly on a multiple).
- [ ] The view model exposes the Journey chart series: one point per snapshot with Levels earned together. There are no per-Player series.
- [ ] The page shows the Levels earned together tile, the Next Group Milestone tile, and the Journey chart in place of the old race chart. A friendly note shows when history is too short for a chart.
- [ ] The Group average is gone from the view model and the page.
- [ ] Checked in the browser preview with mock and armory data.
