import type { DungeonSuggestion } from '../lib/dungeons.ts';
import { PlayerName } from './GameLinks.tsx';

const FACTION_NAME = { ALLIANCE: 'Alliance', HORDE: 'Horde' } as const;

/** Dungeons at least two Mains currently fit: who could play together tonight. */
export function DungeonSuggestions({ suggestions, classOf }: { suggestions: DungeonSuggestion[]; classOf: Record<string, string> }) {
  if (suggestions.length === 0) {
    return <div className="note">No dungeon fits two Mains right now. Suggestions appear as soon as two of you are in range.</div>;
  }
  // Only name the faction when the Group spans both.
  const mixed = new Set(suggestions.map((d) => d.faction)).size > 1;
  return (
    <ul className="dungeons">
      {suggestions.map((d) => (
        <li key={`${d.name}:${d.faction}`}>
          <span className="name">{d.name}</span> <span className="range">({d.minLevel}–{d.maxLevel})</span>
          {mixed && <span className="range"> · {FACTION_NAME[d.faction]}</span>}
          <div className="fits">
            {d.mains.map((m, i) => (
              <span key={m.character} title={m.character}>
                {i > 0 && ', '}<PlayerName player={m.player} className={classOf[m.player]} />
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
