/** The game's experience bar: segmented purple, with the numbers centred on it. */
export function XpBar({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="xp-bar" role="progressbar" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}>
      <div className="fill" style={{ width: `${pct}%` }} />
      <div className="label">{label}</div>
    </div>
  );
}
