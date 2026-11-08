import { GroupTable } from '../components/GroupTable.tsx';
import { LocalTime } from '../components/LocalTime.tsx';
import { buildDashboard } from '../lib/dashboard.ts';
import { roster } from '../lib/roster.ts';
import { readSnapshots } from '../lib/store.ts';

export default async function Page() {
  const data = buildDashboard(await readSnapshots(), roster);
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
              <div className="sub">{data.characters.length} Mains</div>
            </div>
            <div className="tile">
              <div className="label">Levels gained</div>
              <div className="value">+{stats.groupGained24h.toFixed(1)}</div>
              <div className="sub">{stats.historyHours >= 24 ? 'whole Group' : `tracked for ${Math.max(0, Math.round(stats.historyHours))} h so far`}</div>
            </div>
            <div className="tile">
              <div className="label">Played today</div>
              <div className="value">{stats.activeToday}</div>
              <div className="sub">of {data.characters.length}</div>
            </div>
          </section>

          <section className="card">
            <h2>Class mix</h2>
            <p className="desc">Classes in the Group right now.</p>
            <div className="mix">
              {data.classMix.map((m) => (
                <span className="chip" key={m.className}><b>{m.count}</b> {m.className}</span>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>The Group</h2>
            <p className="desc">Everyone on the Journey.</p>
            <GroupTable data={data} />
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
