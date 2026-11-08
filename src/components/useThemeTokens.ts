'use client';

import { useEffect, useState } from 'react';

// Recharts writes colors as SVG attributes, where CSS var() is not reliable,
// so resolve the tokens from :root and re-resolve when the color scheme flips.
export function useThemeTokens<K extends string>(names: readonly K[]): Record<K, string> | null {
  const [tokens, setTokens] = useState<Record<K, string> | null>(null);
  const key = names.join(',');
  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      setTokens(Object.fromEntries(names.map((n) => [n, style.getPropertyValue(`--${n}`).trim()])) as Record<K, string>);
    };
    read();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return tokens;
}
