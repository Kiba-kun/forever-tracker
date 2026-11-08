'use client';

import { useEffect, useState } from 'react';

// The page is built on a server (UTC) and viewed later, so times are rendered
// in the viewer's browser: absolute in their timezone, or relative to "now".

function ago(ms: number) {
  const m = Math.round(ms / 60_000);
  if (m < 60) return m <= 1 ? 'just now' : `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

export function LocalTime({ ts, mode }: { ts: number; mode: 'ago' | 'datetime' }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const iso = new Date(ts).toISOString();
  if (now == null) return <time dateTime={iso}>&nbsp;</time>;
  return (
    <time dateTime={iso} title={new Date(ts).toLocaleString()}>
      {mode === 'ago' ? ago(now - ts) : new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
    </time>
  );
}
