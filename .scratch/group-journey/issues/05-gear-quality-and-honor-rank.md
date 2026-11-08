# 05: Gear quality and honor rank from the armory main page

Parent spec: `.scratch/group-journey/spec.md` (see "New character fields"). Terms: `CONTEXT.md`.

**What to build:** The Journey log celebrates a Main's first Rare item, first Epic item, and each honor rank gained on our PvP realm. The poller reads the best equipped gear quality and the honor rank from the armory main page it already fetches, and stores them as small summaries. The mock source produces them too, so the page can be previewed locally.

**Blocked by:** 03 (Milestone engine and Journey log).

**Status:** ready-for-agent

- [ ] The stored character data gains two nullable fields: best equipped gear quality (Poor < Common < Uncommon < Rare < Epic < Legendary) and honor rank (a number).
- [ ] Armory parsing tests use the real captures from 2026-11-08 in `.scratch/group-journey/fixtures/`. Copy what the tests need into the repo's test fixtures. The tests check the extracted best quality and honor rank, plus fields already parsed (level, spec, professions).
- [ ] Personal Milestones:
  - best gear quality reaches Rare for the first time
  - best gear quality reaches Epic for the first time
  - honor rank increases

  Tested through the dashboard builder, including the Baseline rule (the first sighting of the new fields is quiet).
- [ ] Snapshots without these fields, from before this ticket, read as `null` and cause no Milestones.
- [ ] The mock source generates both fields in the same shape.
- [ ] Item level and honorable kills stay off the page.
