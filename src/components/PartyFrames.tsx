import type { DashboardData } from '../lib/dashboard.ts';
import { CharacterName } from './GameLinks.tsx';
import { LocalTime } from './LocalTime.tsx';

/** Highest profession skill in the original-era game (Artisan). */
const PROFESSION_MAX = 300;

const pctOf = (n: number) => `${(Math.min(n, PROFESSION_MAX) / PROFESSION_MAX) * 100}%`;

/**
 * The Group as party frames, one per Main in roster order, Player first. Never sorted or ranked (docs/PRODUCT.md).
 */
export function PartyFrames({ characters }: { characters: DashboardData['characters'] }) {
  return (
    <ul className="party">
      {characters.map((c) => {
        // Primaries first, then secondaries (Cooking, Fishing, First Aid) in a quieter style.
        const professions = [...(c.professions ?? [])].sort((a, b) => Number(b.primary) - Number(a.primary));
        return (
          <li className="unit" key={c.name}>
            <div className="head">
              <div className="portrait">{c.avatarUrl ? <img src={c.avatarUrl} alt="" /> : c.className[0]}</div>
              <div className="level">{c.level}</div>
              <div>
                <div className="player">{c.player}</div>
                <div className="character"><CharacterName name={c.name} className={c.className} />{c.isGhost && ' 👻'}</div>
                <div className="class">{c.spec ? `${c.spec} ${c.className}` : c.className}</div>
              </div>
              <div className="seen"><LocalTime ts={c.lastLogin} mode="ago" /></div>
            </div>
            <div className="professions">
              {professions.length === 0 && <span className="muted">No professions yet</span>}
              {professions.map((p) => (
                <div className={`profession${p.primary ? '' : ' secondary'}`} key={p.name} title={`${p.name} ${p.skill} (trained up to ${p.max} of ${PROFESSION_MAX})`}>
                  <span>{p.name}</span>
                  {/* Same 0–300 scale for every bar; the lighter segment is the current training cap. */}
                  <span className="track">
                    <span className="cap" style={{ width: pctOf(p.max) }} />
                    <span className="fill" style={{ width: pctOf(p.skill) }} />
                    <span className="skill">{p.skill}</span>
                  </span>
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
