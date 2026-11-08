'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RaceSeries } from '../lib/dashboard.ts';
import { SERIES_TOKENS, seriesVar } from './series.ts';
import { useThemeTokens } from './useThemeTokens.ts';

const fmtTick = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
const fmtWhen = (t: number) =>
  new Date(t).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

interface TipProps {
  active?: boolean;
  label?: number;
  payload?: { dataKey: string; value: number; color: string }[];
}

function RaceTooltip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length || label == null) return null;
  const rows = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="tooltip">
      <div className="when">{fmtWhen(label)}</div>
      {rows.map((r) => (
        <div className="row" key={r.dataKey}>
          <span className="swatch" style={{ background: r.color }} />
          <span className="n">{r.dataKey}</span>
          <span className="v">{r.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export function LevelRaceChart({ series, data }: { series: RaceSeries[]; data: Record<string, number>[] }) {
  const tokens = useThemeTokens([...SERIES_TOKENS, 'grid', 'text-muted', 'border'] as const);
  const [focus, setFocus] = useState<string | null>(null);

  // One tick per local midnight inside the data range.
  const ticks: number[] = [];
  if (data.length) {
    const d = new Date(data[0].t);
    d.setHours(24, 0, 0, 0);
    for (; d.getTime() <= data[data.length - 1].t; d.setDate(d.getDate() + 1)) ticks.push(d.getTime());
  }

  return (
    <>
      <ul className="legend" aria-label="Characters">
        {series.map((s) => (
          <li
            key={s.name}
            className={focus && focus !== s.name ? 'dim' : undefined}
            onMouseEnter={() => setFocus(s.name)}
            onMouseLeave={() => setFocus(null)}
          >
            <span className="swatch" style={{ background: seriesVar(s.slot) }} />
            {s.name}
          </li>
        ))}
      </ul>
      <div style={{ height: 320 }}>
        {tokens && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={tokens.grid} vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                ticks={ticks}
                tickFormatter={fmtTick}
                tick={{ fill: tokens['text-muted'], fontSize: 11 }}
                stroke={tokens.border}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={[1, 'auto']}
                allowDecimals={false}
                tick={{ fill: tokens['text-muted'], fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<RaceTooltip />} cursor={{ stroke: tokens['text-muted'], strokeDasharray: '3 3' }} />
              {series.map((s) => (
                <Line
                  key={s.name}
                  dataKey={s.name}
                  type="stepAfter"
                  stroke={tokens[SERIES_TOKENS[s.slot % 8]]}
                  strokeWidth={2}
                  strokeOpacity={focus && focus !== s.name ? 0.15 : 1}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
