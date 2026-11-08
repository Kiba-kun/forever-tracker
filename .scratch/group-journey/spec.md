---
title: Group Journey — replace the Leaderboard with a shared story
labels: [ready-for-agent]
status: open
---

# Group Journey: replace the Leaderboard with a shared story

Product principles and MVP scope: `docs/PRODUCT.md`. Vocabulary: `CONTEXT.md`. This spec uses the glossary terms exactly (Group, Player, Character, Main, Journey, Milestone, Personal Milestone, Group Milestone, Baseline, Levels earned together, Journey log, Dungeon suggestion).

## Problem Statement

Our Group plays WoW Forever together. For us it's a journey, not a race to 60. The tracker frames it as a race anyway:
- a "Leading" tile crowns whoever is highest
- a "Level race" chart puts every Main on competing lines
- a "Who's been grinding" chart ranks recent effort
- the Leaderboard sorts the Group by level with a `#` column

The Player who has the least time to play is always at the bottom of every view. Meanwhile the tracker records nothing worth celebrating: no moments, no story, no help finding someone to play with. And because the armory only shows current state, anything the Group accomplished is gone unless we notice it at the time.

## Solution

The page tells the Group's shared story.

- **Shared numbers instead of rankings:** Levels earned together, the next Group Milestone, levels gained recently, and how many Players played today.
- **The Journey chart:** one line for the whole Group, with Group Milestones marked on it.
- **The Journey log:** a dated timeline of Personal and Group Milestones, newest first.
- **Dungeon suggestions:** which dungeons at least two Mains currently fit, and who those Mains are.
- **The Group table:** Mains in a fixed order, Player first, with no rank and no item level.

Milestones are detected by comparing each stored snapshot with the one before it. The first time the tracker sees anything, that's a Baseline and produces no Milestone. To detect more kinds of Milestone, the poller starts reading reputation, achievement counts, mounts, equipped gear quality and honor rank from the armory.

## User Stories

### Seeing the Group, not a ranking

1. As a Player, I want the page to open on numbers that belong to the whole Group, so that the first thing I see is what we've done together.
2. As a Player, I want to see Levels earned together, so that every level anyone earns visibly adds to one shared total.
3. As a Player, I want Levels earned together to never go down, so that a reroll or a missed poll never looks like the Group lost progress.
4. As a Player, I want to see the next Group Milestone and how far away it is (e.g. "112 / 200 levels together"), so that we have a shared goal to push towards.
5. As a Player, I want to see how many levels the whole Group gained recently, so that I can feel the Group's momentum without seeing who contributed what.
6. As a Player, I want to see how many Players played today, so that I know whether people are online without anyone being named as inactive.
7. As a Player who plays less, I want to never appear at the bottom of a sorted list, so that the tracker doesn't make me feel behind.
8. As a Player, I want Mains always listed in the same fixed order, so that I find my friends in the same place every time.
9. As a Player, I want the page to never name a leader or a "top" anyone, so that nobody is crowned and nobody is last.
10. As a Player, I want the page to never show who gained, played or earned the most, so that effort isn't turned into a contest.
11. As a Player, I want item level, honorable kill counts and stats kept off the page, so that numbers that invite comparison don't sneak back in.

### The Group table

12. As a Player, I want to see each Main with its Player's name first (e.g. "Andrii · Horizontally Blessed"), so that the table reads as people, not characters.
13. As a Player, I want to see each Main's class and spec, level, professions and when they were last seen, so that I know where everyone is on their journey.
14. As a Player, I want the table to have no rank column, so that a table of friends doesn't look like standings.
15. As a Player, I want a Main that failed to load to still be named in the error note, so that I know the data is missing and nobody has been dropped from the Group.

### The Journey chart

16. As a Player, I want a chart of Levels earned together over time, so that I can see the Group's journey as one shared line.
17. As a Player, I want Group Milestones marked on that chart, so that I can see when we hit the big shared moments.
18. As a Player, I want the chart to have no per-Player lines, so that it can't be read as a race.
19. As a Player, I want a friendly note instead of an empty chart when there's not enough history yet, so that the page still makes sense on day one.

### The Journey log

20. As a Player, I want a timeline of Milestones, newest first, so that I can catch up on what happened since I last looked.
21. As a Player, I want each Milestone dated, so that I know when it happened.
22. As a Player, I want Personal and Group Milestones in one timeline, so that it reads as one Group story.
23. As a Player, I want each Personal Milestone told with the Player's name (e.g. "Max reached level 40"), so that it reads as a friend's moment, not a stat.
24. As a Player, I want to see the latest 20 Milestones with a way to see all of them, so that the page stays short but nothing is lost.
25. As a Player, I want the log not to open with dozens of entries like "reached Neutral with Gadgetzan" on day one, so that only real moments appear.

### Personal Milestones

26. As a Player, I want a Milestone when a Main reaches level 10, 20, 30, 40, 50 or 60, so that big levels are celebrated.
27. As a Player, I want reaching 60 to read as a Milestone like any other, not as "finished", so that the Journey keeps going.
28. As a Player, I want a Milestone when a Main chooses or changes their talent spec, so that the Group sees how friends are building their characters.
29. As a Player, I want a Milestone when a Main gets their first mount, so that this classic moment is celebrated.
30. As a Player, I want a Milestone when a Main equips their first Rare item and their first Epic item, so that gear moments are celebrated without comparing item levels.
31. As a Player, I want a Milestone when a Main reaches Honored, Revered or Exalted with a faction, so that reputation grinds are noticed.
32. As a Player, I want a Milestone when a Main's profession reaches a new tier (Journeyman, Expert, Artisan), so that crafting progress counts as part of the Journey.
33. As a Player, I want a Milestone when a Main earns their first dungeon achievement and their first raid achievement, so that group content shows up in the story.
34. As a Player, I want a Milestone when a Main's honor rank goes up, so that PvP progress on our PvP realm is part of the story.

### Group Milestones

35. As a Player, I want a Group Milestone each time Levels earned together passes another 100, so that we share regular wins.
36. As a Player, I want a Group Milestone when every Main is past level 20, 30, 40, 50 and 60, so that bringing everyone along is the thing we celebrate.
37. As a Player, I want a Group Milestone for the Group's first dungeon achievement, so that our first dungeon is remembered.
38. As a Player, I want a Group Milestone when every Main has a mount, so that the whole Group riding together is celebrated.
39. As a Player, I want a Group Milestone that was already true when tracking started to be treated as a Baseline, so that the log doesn't open by announcing things that happened before the tracker existed.

### Baselines and Mains

40. As a Player, I want the first time the tracker sees a Main to be a quiet Baseline, so that a new Main doesn't flood the log.
41. As a Player, I want the first time the tracker reads a new kind of data (e.g. reputation) to be a Baseline, so that shipping a new detector doesn't flood the log either.
42. As a Player who rerolls, I want to switch my Main in the config and keep my history, so that my past Milestones stay in the story.
43. As a Player who rerolls, I want my new Main to start from a Baseline, so that switching Main produces no fake Milestones.
44. As a Player who rerolls, I want the levels my old Main earned to stay in Levels earned together, so that the Group total never drops because I started over.
45. As a Player, I want a temporarily missing value (e.g. a sub-page that failed to load) not to create or reset any Milestone, so that armory hiccups don't produce fake moments or repeat old ones.
46. As a Player, I want each Main to be listed with their Player's name in the config, so that the Group is clearly made of people.

### Dungeon suggestions

47. As a Player, I want to see which dungeons at least two Mains currently fit, so that I know who I can run something with tonight.
48. As a Player, I want each suggestion to show the dungeon's recommended level range and which Mains are in it, so that I can message the right friends.
49. As a Player, I want dungeons only one Main fits left out, so that every suggestion is about playing together.
50. As a Player, I want suggestions to say who can play together and never who is behind, so that they feel like an invitation, not a judgement.
51. As a Player, I want a short friendly note when no dungeon fits two Mains, so that the section never looks broken.

### Living with the armory

52. As a Player, I want a note saying the armory only updates when a character logs out, so that I'm not confused when a level-up shows up late.
53. As a Player, I want a Milestone dated by the poll that first saw it, so that dates are honest about what the tracker can know.
54. As a Player, I want one failing Main or sub-page not to break the whole poll, so that the rest of the Group still updates.

### Running the tracker

55. As the maintainer, I want history to stay small and polls with no changes to stay unsaved, so that the repo and the GitHub Pages build stay quick.
56. As the maintainer, I want Milestones recomputed from the stored history on every build, so that fixing a detection rule also fixes the past.
57. As the maintainer, I want the mock data source to produce the new fields, so that I can preview the whole page locally without the armory.
58. As the maintainer, I want `npm test` to run fast tests with no new dependencies, so that agents can check their work.
59. As a future agent, I want `docs/PRODUCT.md` to say ranking is out, so that I don't add a "most active" stat by accident.

## Implementation Decisions

### Shape of the work

- **No separate events store.** Milestones, Baselines, Levels earned together, the Journey chart series and Dungeon suggestions are all derived from the snapshot history that's already stored, at build time, inside the dashboard builder. The stored history stays the only source of truth.
- **Recorded Milestones (decided 2026-11-08):** a Milestone the Group reached before the tracker could see it (so its first sighting was a Baseline) can be written down by hand in `config/recorded-milestones.json`. The builder takes these as a third input and merges them into the Journey log. They're dated by day only, and a recorded first replaces the same first if it's detected later. This was first used for the Rare items Andrii, Roman and Pavlo got from a dungeon on 2026-11-07. Only gear firsts are supported for now.
- The dashboard builder keeps its role: snapshot history plus the roster in, the page's view model out. It stays a pure function. Milestone detection and Dungeon suggestions can be separate modules behind it, but the builder is the interface the page and the tests use.

### Roster and identity

- `player` becomes **required** on every roster entry. Every entry is a Main; the config file has no alts. The roster order is the fixed display order everywhere.
- History is followed **per Player**. Records from 2026-11-08 mostly lack `player`; newer records carry it. When a Player's Character name differs from the previous snapshot, that Player has switched Main, and the new Main starts from a Baseline.
- Snapshots taken before `player` was required can be matched to a Player through the current roster by Character name.

### New character fields

These are added to the stored character state. Keep them as **summaries, not raw armory data**, so snapshots stay small and only change when something meaningful changes:

- **Reputation:** a list of `{ faction, standing }`, where standing is the tier name (Hated … Exalted). Store the tier only, not points, so grinding inside a tier doesn't create new snapshots.
- **Achievement counts:** completed counts for the Dungeons and Raids categories, from the achievements sub-page category index (`count` per category slug).
- **Mounts:** the number of mounts collected, from the mounts sub-page (`mountsCollected`).
- **Best gear quality:** the highest quality among equipped items (Poor < Common < Uncommon < Rare < Epic < Legendary), from the main page's per-slot gear `quality.type`.
- **Honor rank:** a number, from the main page's `pvp.rank.value`.

Rules for the new fields:
- Every new field is **nullable**. `null` means "unknown": missing from older snapshots, or a sub-page that failed to load.
- Each Main needs up to 4 armory requests per poll: the main page plus the reputation, achievements and mounts sub-pages, all marked by `characterProfileInitialState`.
- If the main page fails, the Main fails, as today. If a sub-page fails, only its field becomes `null`. It never fails the Main.
- The existing "skip unchanged polls" rule keeps working unchanged, because the summaries only change on meaningful events.
- Item level and honorable kills may stay in the stored data, but nothing on the page shows them.

### Milestone rules

A Milestone is `{ at, kind, player?, character?, text-ready data }`:
- `at` is the time of the snapshot where the change was first seen.
- Personal Milestones carry the Player and Main. Group Milestones carry neither.

**Baseline rule.** For each Player and each field, the first known (non-null) value is a Baseline. Only later changes, compared against the **last known** value, can produce Milestones. A `null` never produces a Milestone and never replaces the last known value. A Main switch resets every per-field Baseline for that Player.

**Personal Milestones:**
- A level threshold in {10, 20, 30, 40, 50, 60} crossed. Jumping several thresholds between two polls produces each one.
- Spec chosen (from none) or changed.
- Mounts collected goes from 0 to more than 0.
- Best gear quality reaches Rare for the first time, or Epic for the first time.
- A reputation standing rises to Honored, Revered or Exalted.
- A profession's skill cap (`max`) reaches the Journeyman, Expert or Artisan tier.
- Dungeon achievement count goes from 0 to more than 0; same for raids.
- Honor rank rises above the highest rank the Main has reached before. A rank lost to weekly decay and regained is not a Milestone again.

**Group Milestones:**
- Levels earned together crosses a multiple of 100.
- Every current Main is at or above 20, 30, 40, 50 or 60.
- The first dungeon achievement by any Main.
- Every current Main has a mount.

A Group Milestone whose condition is already true in the first snapshot that can evaluate it is a Baseline.

### Group numbers

- **Levels earned together** = for every Character ever recorded, (highest level seen − 1), summed. The poller only records roster Mains, so every recorded Character was a Main. Rerolled Mains, Players who left and Mains a poll missed all keep counting, which is what makes the number grow-only.
- **Next Group Milestone** = the next multiple of 100 above Levels earned together, shown with the current value.
- **Levels gained** (whole Group, over the last 24 hours or the available history) and **Played today** keep today's logic but are only exposed as Group totals. The view model no longer exposes per-Main "gained" numbers.
- **The Journey chart series:** one point per snapshot with Levels earned together, plus the Group Milestones to mark on it.

### Dungeon suggestions

- A fixed table of original-era dungeons, each with a name and recommended level range, kept in code. It covers Ragefire Chasm through the level-60 dungeons; the Scarlet Monastery wings and Dire Maul wings are listed separately.
- A suggestion is any dungeon whose range includes the current level of at least 2 Mains of the same faction (players of different factions can't group). Dungeons entered from inside a faction's capital (Ragefire Chasm, The Stockade) are only suggested to that faction. Ordered by the dungeon's level range; each lists the Mains in roster order.

### View model changes

- **Removed:** the leader, the per-Main level race series, per-Main "gained", and the group average level.
- **Added:** Levels earned together, the next Group Milestone, the Journey chart series, the Journey log (all Milestones, newest first; the page shows 20 and can expand), and Dungeon suggestions.
- **Mains** come in roster order with Player first.
- Class mix is unaffected and may stay.

### Page changes

- **Removed:** the Leading tile, the Level race chart, the "Who's been grinding" chart, the `#` column and the item level column.
- **Added:** the Next Group Milestone tile; the Journey chart (replacing the race chart); the Journey log section; the Dungeon suggestions section.
- **Changed:**
  - the Group average tile becomes Levels earned together
  - the Leaderboard becomes "The Group", in roster order with Player first
- **Unchanged:** the armory delay note and the error note.
- Wording follows `CONTEXT.md`. Avoid "race", "standings", "leader", "grinding".

### Mock source

The mock source generates the new fields (reputation tiers, achievement counts, mounts, best gear quality, honor rank) in the same summary shape. `seed:mock` history should then produce a believable Journey log.

## Testing Decisions

- **What makes a good test here:** feed in inputs and check what the public interface returns. Never assert on internal helpers or intermediate structures. Use small hand-built snapshot lists that tell a story ("Max goes 39 → 41", "Lev's Ironforge standing goes Friendly → Honored", "Pavlo rerolls"), and check the resulting view model.
- **Seam 1: the dashboard builder** (snapshot history plus roster in, view model out) is the main seam. It covers:
  - every Personal and Group Milestone rule
  - the Baseline rules: first sighting, new field, `null` handling, Main switch
  - Levels earned together staying grow-only across a reroll
  - the next Group Milestone
  - the Journey chart series
  - the Journey log order
  - Dungeon suggestions (two or more Mains in range; single-Main dungeons left out)
  - Mains in roster order
  - no leader or per-Main gains in the output
- **Seam 2: armory page to character state** (the existing parser and mapper, extended to the sub-pages). Tested with real armory captures from 2026-11-08, saved in `.scratch/group-journey/fixtures/`: main-page character JSON for two Mains, and the reputation, achievements and mounts sub-pages for one. Move what the tests need into the repo's test fixtures. The tests check:
  - the extracted summaries: reputation tiers, Dungeons and Raids counts, mounts collected, best gear quality, honor rank
  - that a missing sub-page gives `null` fields, not a failure
- **Test runner:** Node's built-in `node --test`, run through an `npm test` script. Node 24 already runs the project's `.ts` files directly, so no dependency is added. Test files sit next to the modules they cover.
- **Not unit-tested:** React components and the fetch/poll wiring. Check the page in the browser preview with mock data (`seed:mock`) and with real armory data.
- **Prior art:** none. The repo has no tests yet. Both seams are already pure functions (the dashboard builder, and the armory page parser and mapper), so no new seam is needed.

## Out of Scope

- The "since you were last here" view (postponed).
- Discord posts, webhooks or any other integration (left out to keep the MVP lean).
- Chapters shown on the page (postponed until someone reaches 60).
- Alts, and following more than one Character per Player.
- Per-achievement names and dates (the armory doesn't embed them), quests, current zone, deaths, played time, XP.
- Raid boss-kill progress from the armory's `raids` field (its shape is unknown until someone raids).
- Any ranking, leader or "most" statistic, now or later, unless `docs/PRODUCT.md` is changed first.
- Moving off the JSON snapshot file or off static GitHub Pages hosting.

## Further Notes

- The tracker started recording on 2026-11-08, so there's almost no history and nothing to backfill. Because of the Baseline rule, the first poll after this ships is quiet; Milestones start appearing as the Group plays.
- The armory updates a Character only on logout, so a Milestone's date can lag the real moment by one play session. The page already explains the delay.
- The armory page format is unofficial. A failed sub-page should show up in the poll output so a format change gets noticed, but it must never block the Main's level from updating.
- Recomputing every Milestone on each build is cheap for 6 Mains and a few thousand deduplicated snapshots. If history ever grows large, caching derived Milestones is an optimisation, not a change of model.
