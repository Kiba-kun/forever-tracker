import { DungeonSuggestions } from '../components/DungeonSuggestions.tsx';
import { GroupTable } from '../components/GroupTable.tsx';
import { JourneyChart } from '../components/JourneyChart.tsx';
import { JourneyLog } from '../components/JourneyLog.tsx';
import { LocalTime } from '../components/LocalTime.tsx';
import { buildDashboard, GROUP_MILESTONE_STEP } from '../lib/dashboard.ts';
import { recordedMilestones, roster } from '../lib/roster.ts';
import { readSnapshots } from '../lib/store.ts';

export default async function Page() {
  const data = buildDashboard(await readSnapshots(), roster, recordedMilestones);
  const { stats, nextGroupMilestone: next } = data;

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
              <div className="label">Levels earned together</div>
              <div className="value">{data.levelsTogether}</div>
              <div className="sub">by the whole Group since level 1</div>
            </div>
            <div className="tile">
              <div className="label">Next Group Milestone</div>
              <div className="value">{next.target}<span className="of"> levels</span></div>
              <div className="progress" role="progressbar" aria-valuenow={data.levelsTogether} aria-valuemin={next.target - GROUP_MILESTONE_STEP} aria-valuemax={next.target}>
                <div className="fill" style={{ width: `${((GROUP_MILESTONE_STEP - next.remaining) / GROUP_MILESTONE_STEP) * 100}%` }} />
              </div>
              <div className="sub">{data.levelsTogether} / {next.target} · {next.remaining} more to go, together</div>
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

          <section className="grid">
            <div className="card">
              <h2>The Journey</h2>
              <p className="desc">Levels earned together since tracking started. Every level anyone earns lifts the line.</p>
              {data.journey.length >= 2 ? (
                <JourneyChart data={data.journey} markers={data.journeyMarkers} />
              ) : (
                <div className="note">The Journey line starts building with each poll. Check back after a few hours of play.</div>
              )}
            </div>

            <div className="side-column">
              <div className="card">
                <h2>Dungeon suggestions</h2>
                <p className="desc">Dungeons at least two of you fit right now.</p>
                <DungeonSuggestions suggestions={data.dungeonSuggestions} />
              </div>

              <div className="card">
                <h2>Class mix</h2>
                <p className="desc">Classes in the Group right now.</p>
                <div className="mix">
                  {data.classMix.map((m) => (
                    <span className="chip" key={m.className}><b>{m.count}</b> {m.className}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card journey-log">
            <h2>Journey log</h2>
            <p className="desc">The Group&apos;s Milestones, newest first.</p>
            <JourneyLog milestones={data.milestones} />
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
