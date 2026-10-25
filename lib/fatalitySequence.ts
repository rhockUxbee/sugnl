// State machine for the "Unsubscribality" Easter egg on the unsubscribe pages.
// Purely visual: nothing here touches subscription data.

export type FatalityPhase = "idle" | "activated" | "finish-it" | "fatality" | "victory";

export interface FatalityState {
  phase: FatalityPhase;
  /** Increments on every (re)play so effects and animations restart deterministically. */
  run: number;
}

export type FatalityAction =
  | { type: "trigger"; reducedMotion: boolean }
  | { type: "advance"; run: number }
  | { type: "dismiss" };

export const initialFatalityState: FatalityState = { phase: "idle", run: 0 };

/** How long each timed phase lasts; "victory" stays until dismissed. */
export const PHASE_DURATIONS_MS: Readonly<Partial<Record<FatalityPhase, number>>> = {
  activated: 600,
  "finish-it": 900,
  fatality: 1500,
};

const NEXT_PHASE: Readonly<Partial<Record<FatalityPhase, FatalityPhase>>> = {
  activated: "finish-it",
  "finish-it": "fatality",
  fatality: "victory",
};

/** The animation can only be (re)started when it is not already running. */
export function canTrigger(phase: FatalityPhase): boolean {
  return phase === "idle" || phase === "victory";
}

export function fatalityReducer(state: FatalityState, action: FatalityAction): FatalityState {
  switch (action.type) {
    case "trigger":
      if (!canTrigger(state.phase)) {
        return state;
      }
      // Reduced motion skips straight to a static victory screen.
      return { phase: action.reducedMotion ? "victory" : "activated", run: state.run + 1 };
    case "advance": {
      const next = NEXT_PHASE[state.phase];
      // Ignore advances scheduled by an earlier run or for a phase that has no successor.
      if (action.run !== state.run || !next) {
        return state;
      }
      return { ...state, phase: next };
    }
    case "dismiss":
      return state.phase === "idle" ? state : { ...state, phase: "idle" };
  }
}
