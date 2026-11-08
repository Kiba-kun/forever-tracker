'use client';

import { useEffect, useState } from 'react';

// Recharts writes colors as SVG attributes, where CSS var() is not reliable, so resolve the tokens from :root.
export function useThemeTokens<K extends string>(names: readonly K[]): Record<K, string> | null {
  const [tokens, setTokens] = useState<Record<K, string> | null>(null);
  const key = names.join(',');
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setTokens(Object.fromEntries(names.map((n) => [n, style.getPropertyValue(`--${n}`).trim()])) as Record<K, string>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return tokens;
}
