import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { registerTap, TAP_GAP_MS, TAPS_REQUIRED } from "./tapSequence.ts";

function tapAt(times: readonly number[]): { matches: number; pending: number } {
  let taps: number[] = [];
  let matches = 0;
  for (const time of times) {
    const result = registerTap(taps, time);
    taps = result.taps;
    if (result.matched) {
      matches++;
    }
  }
  return { matches, pending: taps.length };
}

const quickTaps = (count: number, start = 0) => Array.from({ length: count }, (_, i) => start + i * 200);

describe("registerTap", () => {
  test(`${TAPS_REQUIRED} quick taps match once and reset`, () => {
    assert.deepEqual(tapAt(quickTaps(TAPS_REQUIRED)), { matches: 1, pending: 0 });
  });

  test("fewer taps do not match", () => {
    assert.deepEqual(tapAt(quickTaps(TAPS_REQUIRED - 1)), { matches: 0, pending: TAPS_REQUIRED - 1 });
  });

  test("a pause longer than the gap starts counting over", () => {
    const times = [...quickTaps(3), 400 + TAP_GAP_MS + 1, 400 + TAP_GAP_MS + 200];
    assert.deepEqual(tapAt(times), { matches: 0, pending: 2 });
  });

  test("a gap of exactly the limit still counts", () => {
    const times = Array.from({ length: TAPS_REQUIRED }, (_, i) => i * TAP_GAP_MS);
    assert.equal(tapAt(times).matches, 1);
  });

  test("tapping on keeps matching every N taps (replay)", () => {
    assert.equal(tapAt(quickTaps(TAPS_REQUIRED * 2)).matches, 2);
  });
});
