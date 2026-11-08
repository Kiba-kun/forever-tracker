# 01: No more ranking: The Group in roster order, plus a test harness

Parent spec: `.scratch/group-journey/spec.md`. Principles: `docs/PRODUCT.md`. Terms: `CONTEXT.md`.

**What to build:** When a Player opens the page, nothing ranks the Group:
- no "Leading" tile
- no Level race chart
- no "Who's been grinding" chart
- no `#` column and no item level

The Leaderboard becomes **The Group**: Mains in the fixed roster order, each row reading Player first (e.g. "Andrii · Horizontally Blessed") with class and spec, level, professions and last seen. Every roster entry must name its Player. The project gets a test command so later tickets can work test-first.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] `npm test` runs Node's built-in test runner over test files next to their modules, with no new dependencies.
- [x] Dashboard builder tests (snapshot history plus roster in, view model out) cover: Mains come back in roster order whatever their levels; the view model has no leader and no per-Main "gained" numbers.
- [x] `player` is required on roster entries. A roster entry without one fails loudly when the roster loads.
- [x] The Leading tile, the Level race chart, the "Who's been grinding" chart, the `#` column and the item level column are gone from the page.
- [x] The Group table lists Mains in roster order with Player first. Slot colours still follow roster order.
- [x] Kept as they are: Levels gained (whole Group), Played today, class mix, the armory delay note and the error note.
- [x] The Group average tile stays for now (ticket 02 replaces it).
- [x] The page builds and renders with both mock and armory data. Checked in the browser preview.
- [x] No page copy uses "race", "leader", "standings" or "grinding".
