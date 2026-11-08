// Levels gained in the last 24h — one hue (magnitude), sorted, direct-labeled.
// Plain HTML bars: 8 rows don't need a chart library.

interface Row {
  name: string;
  gained24h: number;
}

export function GainsChart({ rows }: { rows: Row[] }) {
  const sorted = [...rows].sort((a, b) => b.gained24h - a.gained24h);
  const max = Math.max(...sorted.map((r) => r.gained24h), 1);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {sorted.map((r) => (
        <div key={r.name} title={`${r.name}: +${r.gained24h.toFixed(1)} levels`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 9.5em) 1fr 3em', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
          <div style={{ height: 14 }}>
            <div style={{ width: `${(r.gained24h / max) * 100}%`, minWidth: r.gained24h > 0 ? 4 : 0, height: '100%', background: 'var(--bar)', borderRadius: '0 4px 4px 0' }} />
          </div>
          <span style={{ fontSize: 12, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>+{r.gained24h.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
