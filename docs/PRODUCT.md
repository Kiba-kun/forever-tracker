# Forever Tracker: product

Forever Tracker is a shared record of our Group's Journey through WoW Forever. Its job is to celebrate what we accomplish together. Domain terms (Group, Player, Main, Milestone and so on) are defined in [CONTEXT.md](../CONTEXT.md).

## Principles

These rules hold for every feature. A change that breaks one needs an explicit decision from the Group first, not a quiet addition.

1. **The Group is the hero.** The page tells one shared story. Players show up as part of it, not as competitors.
2. **No ranking between Players.**
   - Never sort Players by level or by any other measure.
   - Never name a leader or a "top" anything.
   - Never show who gained, played or earned the most.
   - Mains always appear in the fixed order of `config/roster.json`.
   - Showing levels side by side is fine. Ordering, crowns and "who's grinding" language are not.
3. **No numbers that invite comparison.** Leave out item level, honorable kill counts and stats.
   - The tracker never shows these itself. Hovering an item may show Wowhead's tooltip for that one item, because it describes the item, not a Player. (Amended 2026-11-08 for the WoW-style redesign.)
4. **The Journey has no finish line.** Reaching 60 closes a Chapter, not the Journey. Nobody is "done" while others are still playing.
5. **People, not characters.** Every Main belongs to a named Player, and the page shows the Player first. Alts are not followed. A Player who rerolls switches Main and keeps their history.

## Why

WoW Forever is not a race to 60 for us. It's a journey we take together. A leaderboard turns friends into rivals and keeps the slowest Player at the bottom of the table all the time. The first version of the tracker had a leaderboard, a "Leading" tile, a level-race chart and a "who's been grinding" chart. All of them are being replaced.

## MVP scope

The page, top to bottom, in the WoW Classic look: dark stone-and-gold windows, Character names in class colour, items and mounts in their Quality colour.

- **Tiles**
  - Levels earned together.
  - Next Group Milestone (for example "112 / 200 levels together").
  - Levels gained recently, for the whole Group.
  - How many Players played today.
- **The Journey chart.** One Group line of levels earned together over time, with Group Milestones marked. There are no per-Player lines.
- **Journey log.** Milestones in time order like a WoW chat window, newest at the bottom, with Personal and Group Milestones mixed together and dated. It opens on the newest lines and scrolls back to the first.
- **Dungeon suggestions.** Every original-era dungeon whose recommended level range currently includes at least two Mains, with who fits. Uses a fixed table of dungeon level ranges.
- **The Group.** One party frame per Main in roster order, with Player, Character, class and spec, level, professions and last seen. No rank and no item level.

### Milestones

The armory shows only current state and keeps no history. So Milestones are noticed by comparing each poll with the previous one. The first sighting of a Main, or of a field the tracker has just started reading, is a **Baseline** and never a Milestone.

- **Personal Milestones:**
  - level 10, 20, 30, 40, 50 and 60
  - talent spec chosen or changed
  - riding mount, named in its Quality colour
  - first Rare and first Epic item, naming the items with links to Wowhead (Milestones recorded by hand stay unnamed)
  - reputation tier up (Honored, Revered, Exalted)
  - profession tier (Journeyman, Expert, Artisan)
  - first dungeon or raid achievement
  - honor rank up
- **Group Milestones:**
  - levels earned together passing 100, 200 and so on
  - every Main past level 20, 30 and so on
  - the Group's first dungeon achievement
  - every Main mounted

### Data the armory provides (checked 2026-11-08)

- **Available:** level, talents, gear per slot with quality, reputation standings, achievement counts per category, mounts and pets, honor rank, professions.
- **Not available:** XP within a level, quests, current zone, deaths, played time, the names or dates of individual achievements.
- A character's armory data refreshes only when they log out.

## Not in the MVP

- **"Since you were last here" view.** Postponed.
- **Discord posts and integrations.** Out of scope to keep the MVP lean.
- **Chapters shown on the page.** Postponed until someone reaches 60 and we know what the next Chapter looks like.
