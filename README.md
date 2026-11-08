# Forever Tracker

Level-progress dashboard for our WoW Forever group (Next.js + Recharts).

## Setup

```bash
npm install
cp .env.example .env   # fill in Battle.net client ID/secret
npm run poll -- --watch   # snapshot the roster every 15 min (keep it running)
npm run dev
```

## Data flow

`config/roster.json` → source (`DATA_SOURCE`) → `CharacterState` → snapshot appended to
`data/snapshots.json` → dashboard.

| `DATA_SOURCE` | What it reads | Notes |
|---|---|---|
| `armory` | JSON embedded in the public armory page (`characterProfileInitialState`) | Works now. No XP. Refreshes when a character logs out. Unofficial format. |
| `blizzard` | Official Profile API, `profile-forever-eu` | 404 on EU as of 2026-11-08. |
| `mock` | Generated data in the API's response shape | `npm run seed:mock` for demo history. |

Snapshots from a different source are discarded on the next poll, so mock and real data never mix.

- `npm run poll`: take one snapshot of the roster (schedule it every ~15 min)
- `npm run probe`: check which Forever namespaces/realms the API serves

## Switching to the real API

As of 2026-11-08, EU Forever character profiles return 404
([forum thread](https://us.forums.blizzard.com/en/blizzard/t/wow-forever-eu-all-character-profile-endpoints-return-404/60355)).
When that changes:

1. Find the working character URL format and adjust `characterPath()` in
   `src/lib/blizzard/client.ts` (or set `BNET_FOREVER_REALM_SEGMENT`).
2. Compare a real response with `src/lib/blizzard/types.ts`.
3. Set `DATA_SOURCE=blizzard`, delete `data/snapshots.json`, then run `npm run poll`.
