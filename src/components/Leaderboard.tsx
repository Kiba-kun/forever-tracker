import type { DashboardData } from '../lib/dashboard.ts';
import { LocalTime } from './LocalTime.tsx';
import { seriesVar } from './series.ts';

/** Highest profession skill in the original-era game (Artisan). */
const PROFESSION_MAX = 300;

export function Leaderboard({ data }: { data: DashboardData }) {
  const hasXp = data.characters.some((c) => c.xp != null);
  const hasProfessions = data.characters.some((c) => c.professions?.length);
  return (
    <div className="board-wrap">
      <table className="board">
        <thead>
          <tr>
            <th>#</th>
            <th>Character</th>
            <th className="hide-sm">Class</th>
            <th>Level</th>
            {hasXp && <th>Progress to next</th>}
            {hasProfessions && <th className="hide-sm">Professions</th>}
            <th className="hide-sm num">Item lvl</th>
            <th className="hide-sm num">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {data.characters.map((c, i) => {
            const pct = c.xp != null && c.xpToNext ? (c.xp / c.xpToNext) * 100 : null;
            return (
              <tr key={c.name}>
                <td className="rank">{i + 1}</td>
                <td>
                  <div className="who">
                    <div className="avatar" style={{ boxShadow: `inset 0 0 0 2px ${seriesVar(c.slot)}` }}>
                      {c.avatarUrl ? <img src={c.avatarUrl} alt="" /> : c.className[0]}
                    </div>
                    <div>
                      <div className="name">{c.name}{c.isGhost ? ' 👻' : ''}</div>
                      <div className="player">
                        {[c.player, c.guild && `<${c.guild}>`].filter(Boolean).join(' · ') || `${c.race} ${c.className}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hide-sm">
                  <div>{c.spec ? `${c.spec} ${c.className}` : c.className}</div>
                  <div className="muted">{c.race}</div>
                </td>
                <td className="lvl">{c.level}</td>
                {hasXp && (
                  <td className="xp">
                    {c.xpToNext == null ? (
                      <span className="muted">Max level</span>
                    ) : pct == null ? (
                      <span className="muted">—</span>
                    ) : (
                      <>
                        <div className="track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                          <div className="fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="txt">{c.xp!.toLocaleString('en-GB')} / {c.xpToNext.toLocaleString('en-GB')} XP · {Math.round(pct)}%</div>
                      </>
                    )}
                  </td>
                )}
                {hasProfessions && (
                  <td className="hide-sm">
                    <div className="profs">
                      {/* Primaries first, then secondaries (Cooking, Fishing, First Aid) in a quieter style. */}
                      {[...(c.professions ?? [])]
                        .sort((a, b) => Number(b.primary) - Number(a.primary))
                        .map((p, i, all) => (
                          <div
                            key={p.name}
                            className={`prof${p.primary ? '' : ' secondary'}${!p.primary && all[i - 1]?.primary ? ' first-secondary' : ''}`}
                            title={`${p.name} ${p.skill} (trained up to ${p.max} of ${PROFESSION_MAX})`}>
                            <span>{p.name}</span>
                            {/* Same 0–300 scale for every bar; the lighter segment is the current training cap. */}
                            <span className="track">
                              <span className="cap" style={{ width: `${(Math.min(p.max, PROFESSION_MAX) / PROFESSION_MAX) * 100}%` }} />
                              <span className="fill" style={{ width: `${(Math.min(p.skill, PROFESSION_MAX) / PROFESSION_MAX) * 100}%` }} />
                            </span>
                            <span className="muted">{p.skill}</span>
                          </div>
                        ))}
                      {!c.professions?.length && <span className="muted">—</span>}
                    </div>
                  </td>
                )}
                <td className="hide-sm num">{c.itemLevel ?? '—'}</td>
                <td className="hide-sm num muted"><LocalTime ts={c.lastLogin} mode="ago" /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
