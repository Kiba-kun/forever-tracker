'use client';

import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardData } from '../lib/dashboard.ts';
import { useThemeTokens } from './useThemeTokens.ts';

const fmtTick = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
const fmtWhen = (t: number) =>
  new Date(t).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

type Markers = DashboardData['journeyMarkers'];

interface TipProps {
  active?: boolean;
  label?: number;
  payload?: { value: number }[];
  markers?: Markers;
}

function JourneyTooltip({ active, label, payload, markers }: TipProps) {
  if (!active || !payload?.length || label == null) return null;
  const here = markers?.filter((m) => m.t === label) ?? [];
  return (
    <div className="tooltip">
      <div className="when">{fmtWhen(label)}</div>
      <div className="row">
        <span className="n">Levels earned together</span>
        <span className="v">{payload[0].value}</span>
      </div>
      {here.map((m) => <div className="milestone" key={m.text}>★ {m.text}</div>)}
    </div>
  );
}

/**
 * The Group's Journey: one line of Levels earned together, with Group Milestones marked.
 * Deliberately no per-Player lines (docs/PRODUCT.md).
 */
export function JourneyChart({ data, markers }: { data: DashboardData['journey']; markers: Markers }) {
  const tokens = useThemeTokens(['accent', 'grid', 'text-muted', 'border', 'surface-1'] as const);

  // One tick per local midnight inside the data range.
  const ticks: number[] = [];
  if (data.length) {
    const d = new Date(data[0].t);
    d.setHours(24, 0, 0, 0);
    for (; d.getTime() <= data[data.length - 1].t; d.setDate(d.getDate() + 1)) ticks.push(d.getTime());
  }

  return (
    <div style={{ height: 280 }}>
      {tokens && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
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
              domain={[0, 'auto']}
              allowDecimals={false}
              tick={{ fill: tokens['text-muted'], fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<JourneyTooltip markers={markers} />} cursor={{ stroke: tokens['text-muted'], strokeDasharray: '3 3' }} />
            <Area
              dataKey="levelsTogether"
              type="stepAfter"
              stroke={tokens.accent}
              strokeWidth={2}
              fill={tokens.accent}
              fillOpacity={0.12}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {markers.map((m) => (
              <ReferenceDot
                key={`${m.t}:${m.text}`}
                x={m.t}
                y={m.levelsTogether}
                r={5}
                fill={tokens.accent}
                stroke={tokens['surface-1']}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
