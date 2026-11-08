import { GainsChart } from '../components/GainsChart.tsx';
import { Leaderboard } from '../components/Leaderboard.tsx';
import { LevelRaceChart } from '../components/LevelRaceChart.tsx';
import { LocalTime } from '../components/LocalTime.tsx';
import { buildDashboard } from '../lib/dashboard.ts';
import { roster } from '../lib/roster.ts';
import { readSnapshots } from '../lib/store.ts';

export default async function Page() {
  const data = buildDashboard(await readSnapshots(), roster.map((r) => r.name));
  const { stats } = data;

  return (
    <main className="page">
      <header className="header">
        <h1>Forever <span>Tracker</span></h1>
        <div className="meta">
          {data.updatedAt ? (
            <>Last change detected <LocalTime ts={data.updatedAt} mode="ago" /></>
          ) : (
            'No data yet'
          )}
        </div>
      </header>

      {data.source === 'armory' && (
        <div className="banner">
          <strong>Live from the Armory.</strong> The armory refreshes a character when they log out, so levels lag live
          play. Checked every 15 minutes.
        </div>
      )}

      {data.source === 'mock' && (
        <div className="banner">
          <strong>Mock data.</strong> Blizzard hasn&apos;t enabled EU WoW Forever character profiles yet. Once they do,
          set <code>DATA_SOURCE=blizzard</code> in <code>.env</code> and run <code>npm run poll</code>.
        </div>
      )}

      {data.characters.length === 0 ? (
        <div className="card empty">
          No snapshots yet. Run <code>npm run seed:mock</code> or <code>npm run poll</code>.
        </div>
      ) : (
        <>
          <section className="tiles">
            <div className="tile">
              <div className="label">Group average</div>
              <div className="value">{stats.avgLevel.toFixed(1)}</div>
              <div className="sub">{data.characters.length} characters</div>
            </div>
            <div className="tile">
              <div className="label">Leading</div>
              <div className="value">{stats.leader?.level}</div>
              <div className="sub">{stats.leader?.name}</div>
            </div>
            <div className="tile">
              <div className="label">Levels gained</div>
              <div className="value">+{stats.groupGained24h.toFixed(1)}</div>
              <div className="sub">{stats.historyHours >= 24 ? 'whole group' : `tracked for ${Math.max(0, Math.round(stats.historyHours))} h so far`}</div>
            </div>
            <div className="tile">
              <div className="label">Played today</div>
              <div className="value">{stats.activeToday}</div>
              <div className="sub">of {data.characters.length}</div>
            </div>
          </section>

          <section className="grid">
            <div className="card">
              <h2>Level race</h2>
              <p className="desc">
                {data.source === 'armory' ? 'Level over time, since tracking started.' : 'Level including progress into the next one, since launch.'} Hover a name to focus it.
              </p>
              {data.race.length >= 2 ? (
                <LevelRaceChart series={data.series} data={data.race} />
              ) : (
                <div className="note">History starts building with each poll. Check back after a few hours of play.</div>
              )}
            </div>
            <div className="card">
              <h2>Levels gained, last {stats.historyHours >= 24 || stats.historyHours < 1 ? '24 hours' : `${Math.round(stats.historyHours)} h`}</h2>
              <p className="desc">Who&apos;s been grinding.</p>
              {stats.historyHours >= 1 ? (
                <GainsChart rows={data.characters} />
              ) : (
                <div className="note">Needs at least an hour of history.</div>
              )}
              <h2 style={{ marginTop: 24 }}>Class mix</h2>
              <p className="desc">Classes in the group right now.</p>
              <div className="mix">
                {data.classMix.map((m) => (
                  <span className="chip" key={m.className}><b>{m.count}</b> {m.className}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Leaderboard</h2>
            <p className="desc">Current standings.</p>
            <Leaderboard data={data} />
            {data.errors.length > 0 && (
              <div className="errors">
                Couldn&apos;t fetch: {data.errors.map((e) => `${e.name} (${e.message})`).join('; ')}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
