import type { DungeonSuggestion } from '../lib/dungeons.ts';

const FACTION_NAME = { ALLIANCE: 'Alliance', HORDE: 'Horde' } as const;

/** Dungeons at least two Mains currently fit: who could play together tonight. */
export function DungeonSuggestions({ suggestions }: { suggestions: DungeonSuggestion[] }) {
  if (suggestions.length === 0) {
    return <div className="note">No dungeon fits two Mains right now. Suggestions appear as soon as two of you are in range.</div>;
  }
  // Only name the faction when the Group spans both.
  const mixed = new Set(suggestions.map((d) => d.faction)).size > 1;
  return (
    <ul className="dungeons">
      {suggestions.map((d) => (
        <li key={`${d.name}:${d.faction}`}>
          <div className="dungeon">
            <span className="name">{d.name}{mixed && <span className="faction"> · {FACTION_NAME[d.faction]}</span>}</span>
            <span className="range">{d.minLevel}–{d.maxLevel}</span>
          </div>
          <ul className="fits">
            {d.mains.map((m) => (
              <li key={m.character}>{m.player} <span className="character">· {m.character}</span></li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
