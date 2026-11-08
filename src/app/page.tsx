import { DungeonSuggestions } from '../components/DungeonSuggestions.tsx';
import { Frame } from '../components/Frame.tsx';
import { JourneyChart } from '../components/JourneyChart.tsx';
import { JourneyLog } from '../components/JourneyLog.tsx';
import { LocalTime } from '../components/LocalTime.tsx';
import { PartyFrames } from '../components/PartyFrames.tsx';
import { XpBar } from '../components/XpBar.tsx';
import { buildDashboard, GROUP_MILESTONE_STEP } from '../lib/dashboard.ts';
import { recordedMilestones, roster } from '../lib/roster.ts';
import { readSnapshots } from '../lib/store.ts';

export default async function Page() {
  const data = buildDashboard(await readSnapshots(), roster, recordedMilestones);
  const { stats, nextGroupMilestone: next } = data;
  const classOf = Object.fromEntries(data.characters.map((c) => [c.player, c.className]));

  return (
    <main className="page">
      <h1 className="title"><span className="star">✦</span> Forever Tracker <span className="star">✦</span></h1>

      {data.source === 'mock' && (
        <div className="frame banner">
          <strong>Mock data.</strong> Blizzard hasn&apos;t enabled EU WoW Forever character profiles yet. Once they do,
          set <code>DATA_SOURCE=blizzard</code> in <code>.env</code> and run <code>npm run poll</code>.
        </div>
      )}

      {data.characters.length === 0 ? (
        <div className="frame banner">
          No snapshots yet. Run <code>npm run seed:mock</code> or <code>npm run poll</code>.
        </div>
      ) : (
        <>
          <div className="tiles">
            <Frame title="Together">
              <div className="value">{data.levelsTogether}</div>
              <div className="sub">levels earned together</div>
            </Frame>
            <Frame title="Next Group Milestone" className="wide">
              <XpBar
                value={data.levelsTogether}
                min={next.target - GROUP_MILESTONE_STEP}
                max={next.target}
                label={`${data.levelsTogether} / ${next.target} levels together`}
              />
              <div className="sub">{next.remaining} more to go</div>
            </Frame>
            <Frame title="Gained">
              <div className="value">+{stats.groupGained24h.toFixed(1)}</div>
              <div className="sub">{stats.historyHours >= 24 ? 'levels, whole Group' : `tracked for ${Math.max(0, Math.round(stats.historyHours))} h so far`}</div>
            </Frame>
            <Frame title="Today">
              <div className="value">{stats.activeToday}<small> of {data.characters.length}</small></div>
              <div className="sub">played today</div>
            </Frame>
          </div>

          <div className="row">
            <Frame title="The Journey">
              {data.journey.length >= 2 ? (
                <JourneyChart data={data.journey} markers={data.journeyMarkers} />
              ) : (
                <div className="note">The Journey line starts building with each poll. Check back after a few hours of play.</div>
              )}
            </Frame>
            <Frame title="Dungeon Suggestions">
              <DungeonSuggestions suggestions={data.dungeonSuggestions} classOf={classOf} />
            </Frame>
          </div>

          <Frame title="Journey Log">
            <JourneyLog milestones={data.milestones} classOf={classOf} />
          </Frame>

          <Frame title="The Group">
            <PartyFrames characters={data.characters} />
            {data.errors.length > 0 && (
              <div className="errors">
                Couldn&apos;t fetch: {data.errors.map((e) => `${e.name} (${e.message})`).join('; ')}
              </div>
            )}
          </Frame>
        </>
      )}

      <footer className="footer">
        {data.updatedAt ? <>Last change detected <LocalTime ts={data.updatedAt} mode="ago" /></> : 'No data yet'}
        {data.source === 'armory' && ' · Live from the Armory, which refreshes a character when they log out. Checked every 15 minutes.'}
      </footer>
    </main>
  );
}
