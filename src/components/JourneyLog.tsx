import type { ReactNode } from 'react';
import { isGroupMilestone, type Milestone, type PersonalMilestone } from '../lib/milestones.ts';
import { ChatWindow } from './ChatWindow.tsx';
import { ItemLink, MountName, PlayerName, QUALITY_COLOR } from './GameLinks.tsx';
import { LocalTime } from './LocalTime.tsx';

/** "A, B and C" */
function joinedWithAnd(nodes: ReactNode[]): ReactNode[] {
  return nodes.flatMap((n, i) => (i === 0 ? [n] : [i === nodes.length - 1 ? ' and ' : ', ', n]));
}

/** What happened, after the Player's name. Gear and mounts are named when the tracker saw them. */
function whatHappened(m: PersonalMilestone): ReactNode {
  if (m.kind === 'gear') {
    if (m.items?.length) return <>equipped {joinedWithAnd(m.items.map((i) => <ItemLink key={i.id} item={i} />))}.</>;
    return <>equipped their first <span style={{ color: QUALITY_COLOR[m.quality] }}>{m.quality}</span> item.</>;
  }
  if (m.kind === 'mount' && m.mounts?.length) {
    return <>got their first mount {joinedWithAnd(m.mounts.map((x) => <MountName key={x.name} mount={x} />))}.</>;
  }
  if (m.kind === 'reputation') return <>reached {m.standing} with <span className="place">{m.faction}</span>.</>;
  const rest = m.text.startsWith(`${m.player} `) ? m.text.slice(m.player.length + 1) : m.text;
  return `${rest}.`;
}

/** A recorded Milestone's day, e.g. "7 Nov" (its `at` is midday UTC of that day). */
const RECORDED_DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function Line({ m, classOf }: { m: Milestone; classOf: Record<string, string> }) {
  // A recorded Milestone only knows its day: show the date, no time.
  const when = 'day' in m && m.day ? RECORDED_DAY.format(m.at) : <LocalTime ts={m.at} mode="chat" />;
  if (isGroupMilestone(m)) {
    return <li className="system"><span className="when">[{when}]</span> {m.text}.</li>;
  }
  return (
    <li>
      <span className="when">[{when}]</span>{' '}
      [<PlayerName player={m.player} className={classOf[m.player]} />] {whatHappened(m)}
      <span className="character"> · {m.character}</span>
    </li>
  );
}

/**
 * The Journey log as a chat window: oldest first, newest at the bottom, scrolled to the newest.
 * @param milestones newest first, as the dashboard gives them
 * @param classOf each Player's Main's class, for the colour of their name
 */
export function JourneyLog({ milestones, classOf }: { milestones: Milestone[]; classOf: Record<string, string> }) {
  if (milestones.length === 0) {
    return (
      <div className="note">
        No Milestones yet. Level-ups, new specs, profession tiers, reputation, first dungeons, raids and mounts, first
        Rare and Epic items and honor ranks will show up here as the Group plays.
      </div>
    );
  }
  return (
    <ChatWindow>
      {[...milestones].reverse().map((m) => <Line key={`${m.at}:${m.text}`} m={m} classOf={classOf} />)}
    </ChatWindow>
  );
}
