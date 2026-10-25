// Pure "tap N times quickly" detection: the touch-friendly way to trigger the Easter egg.

export interface TapResult {
  /** Timestamps of the taps still counting towards a match. */
  taps: number[];
  /** True when this tap completed the sequence; taps are then reset. */
  matched: boolean;
}

export const TAPS_REQUIRED = 5;
/** Maximum time between two consecutive taps before counting starts over. */
export const TAP_GAP_MS = 800;

export function registerTap(
  taps: readonly number[],
  now: number,
  required: number = TAPS_REQUIRED,
  maxGapMs: number = TAP_GAP_MS
): TapResult {
  const last = taps[taps.length - 1];
  const next = last !== undefined && now - last <= maxGapMs ? [...taps, now] : [now];

  return next.length >= required ? { taps: [], matched: true } : { taps: next, matched: false };
}
