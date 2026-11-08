import { isGroupMilestone, type Milestone } from '../lib/milestones.ts';
import { LocalTime } from './LocalTime.tsx';

/** Milestones shown before "Show all". */
const SHOWN = 20;

function Entry({ m }: { m: Milestone }) {
  return (
    <li className={isGroupMilestone(m) ? 'group' : undefined}>
      <span className="what">
        {m.text}
        {'character' in m && <span className="muted"> · {m.character}</span>}
      </span>
      <span className="when">
        {/* A recorded Milestone only knows its day: show the date, no time. */}
        {'day' in m && m.day
          ? <time dateTime={m.day}>{new Date(m.at).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })}</time>
          : <LocalTime ts={m.at} mode="datetime" />}
      </span>
    </li>
  );
}

/** The Journey log: the Group's Milestones as one story, newest first. */
export function JourneyLog({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <div className="note">
        No Milestones yet. Level-ups, new specs, profession tiers, reputation, first dungeons, raids and mounts, first
        Rare and Epic items and honor ranks will show up here as the Group plays.
      </div>
    );
  }
  const rest = milestones.slice(SHOWN);
  return (
    <>
      <ol className="log">
        {milestones.slice(0, SHOWN).map((m) => <Entry key={`${m.at}:${m.text}`} m={m} />)}
      </ol>
      {rest.length > 0 && (
        <details className="log-more">
          <summary>Show all {milestones.length} Milestones</summary>
          <ol className="log">
            {rest.map((m) => <Entry key={`${m.at}:${m.text}`} m={m} />)}
          </ol>
        </details>
      )}
    </>
  );
}
