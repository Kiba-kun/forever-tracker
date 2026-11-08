export const SERIES_TOKENS = [
  'series-1', 'series-2', 'series-3', 'series-4', 'series-5', 'series-6', 'series-7', 'series-8',
] as const;

/** Series color follows the roster slot (the character), never the current rank. */
export const seriesVar = (slot: number) => `var(--series-${(slot % 8) + 1})`;
