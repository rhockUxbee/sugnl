import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { canTrigger, fatalityReducer, initialFatalityState, PHASE_DURATIONS_MS } from "./fatalitySequence.ts";
import type { FatalityState } from "./fatalitySequence.ts";

const trigger = (state: FatalityState, reducedMotion = false) =>
  fatalityReducer(state, { type: "trigger", reducedMotion });
const advance = (state: FatalityState) => fatalityReducer(state, { type: "advance", run: state.run });

describe("fatalityReducer", () => {
  test("plays all phases in order and stays on victory", () => {
    const phases: string[] = [];
    let state = trigger(initialFatalityState);
    for (let step = 0; step < 5; step++) {
      phases.push(state.phase);
      state = advance(state);
    }
    assert.deepEqual(phases, ["activated", "finish-it", "fatality", "victory", "victory"]);
  });

  test("every animated phase has a duration; victory and idle do not", () => {
    assert.ok(PHASE_DURATIONS_MS.activated);
    assert.ok(PHASE_DURATIONS_MS["finish-it"]);
    assert.ok(PHASE_DURATIONS_MS.fatality);
    assert.equal(PHASE_DURATIONS_MS.victory, undefined);
    assert.equal(PHASE_DURATIONS_MS.idle, undefined);
  });

  test("reduced motion jumps straight to a static victory", () => {
    assert.equal(trigger(initialFatalityState, true).phase, "victory");
  });

  test("cannot be re-triggered while the animation is running", () => {
    const running = trigger(initialFatalityState);
    assert.equal(trigger(running), running);
    assert.equal(trigger(advance(running)).phase, "finish-it");
  });

  test("can be replayed from the victory screen with a new run", () => {
    let state = trigger(initialFatalityState);
    state = advance(advance(advance(state)));
    assert.equal(state.phase, "victory");
    const replay = trigger(state);
    assert.deepEqual(replay, { phase: "activated", run: state.run + 1 });
  });

  test("ignores advances scheduled by an earlier run", () => {
    const first = trigger(initialFatalityState);
    const victory = advance(advance(advance(first)));
    const replay = trigger(victory);
    assert.equal(fatalityReducer(replay, { type: "advance", run: first.run }), replay);
  });

  test("dismiss returns to idle from any phase and keeps the run counter", () => {
    let state = trigger(initialFatalityState);
    for (let step = 0; step < 4; step++) {
      const dismissed = fatalityReducer(state, { type: "dismiss" });
      assert.deepEqual(dismissed, { phase: "idle", run: state.run });
      state = advance(state);
    }
    assert.equal(fatalityReducer(initialFatalityState, { type: "dismiss" }), initialFatalityState);
  });

  test("advancing while idle does nothing", () => {
    assert.equal(advance(initialFatalityState), initialFatalityState);
  });

  test("canTrigger only allows idle and victory", () => {
    assert.deepEqual(
      (["idle", "activated", "finish-it", "fatality", "victory"] as const).map(canTrigger),
      [true, false, false, false, true]
    );
  });
});
