"use client";

import { Press_Start_2P } from "next/font/google";
import { type CSSProperties, useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  canTrigger,
  fatalityReducer,
  type FatalityPhase,
  initialFatalityState,
  PHASE_DURATIONS_MS,
} from "@/lib/fatalitySequence";
import { registerTap } from "@/lib/tapSequence";
import { type ArcadeSound, createArcadeSound } from "./arcadeSound";
import { type ArrowDirection, PixelArrow, PixelCursor, PixelNewsletter } from "./PixelArt";
import { useKonamiCode } from "./useKonamiCode";
import styles from "./unsubscribality.module.css";

const arcadeFont = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap" });

const PARTICLE_COLORS = ["#f4f7ff", "#3d6ff7", "#5b5cf6", "#2fa8ff", "#7c4dff", "#ff4f2f", "#c7d3f6"];

// Deterministic pixel fragments for the explosion.
const PARTICLES = Array.from({ length: 40 }, (_, index) => {
  const angle = (index / 40) * Math.PI * 2 + (index % 3) * 0.21;
  const distance = 80 + ((index * 47) % 130);
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance) - 50,
    rotation: ((index * 73) % 360) - 180,
    size: 7 + (index % 4) * 3,
    color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
    delay: (index % 5) * 16,
  };
});

const SPARKLES = Array.from({ length: 16 }, (_, index) => ({
  x: (index * 61) % 100,
  size: 4 + (index % 3) * 3,
  color: PARTICLE_COLORS[(index + 2) % PARTICLE_COLORS.length],
  delay: (index * 170) % 1400,
}));

const ANNOUNCEMENTS: Record<FatalityPhase, string> = {
  idle: "",
  activated: "Secret finisher unlocked.",
  "finish-it": "Finish it!",
  fatality: "",
  victory:
    "Unsubscribality! Newsletter eliminated. Your inbox wins. This is only an Easter egg: your subscription has not changed.",
};

const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

const CHEAT_CODE = "↑ ↑ ↓ ↓ ← → ← → B A";
const CHEAT_CODE_LABEL = "Secret cheat code: up, up, down, down, left, right, left, right, B, A. Or tap here five times.";
/** The corner prompt appears once a visitor has lingered on the page for a while. */
const PROMPT_DELAY_MS = 10_000;

const CHEAT_CODE_KEYS: readonly (ArrowDirection | "B" | "A")[] = ["up", "up", "down", "down", "left", "right", "left", "right", "B", "A"];

/** The code drawn with pixel arrows; the pixel font has no arrow glyphs. */
function CheatCodeKeys() {
  return (
    <span className={styles.codeKeys} aria-hidden="true">
      {CHEAT_CODE_KEYS.map((key, index) =>
        key === "A" || key === "B" ? (
          <span key={index}>{key}</span>
        ) : (
          <PixelArrow key={index} direction={key} className={styles.codeArrow} />
        )
      )}
    </span>
  );
}

// Logged once per page load, also across client-side navigation between the unsubscribe pages.
let consoleHintShown = false;

/** Subtle hints: a faint code line under the page content and a delayed corner prompt. Both accept 5 quick taps. */
function CheatCodeHints({ showPrompt, onTap }: { readonly showPrompt: boolean; readonly onTap: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onTap}
        aria-label={CHEAT_CODE_LABEL}
        title={CHEAT_CODE_LABEL}
        className={`${styles.codeHint} ${arcadeFont.className}`}
      >
        <CheatCodeKeys />
      </button>
      {showPrompt && (
        <button
          type="button"
          onClick={onTap}
          aria-label={CHEAT_CODE_LABEL}
          className={`${styles.cornerPrompt} ${arcadeFont.className}`}
        >
          <span className={styles.cornerPromptTitle}>CHEAT CODES ENABLED</span>
          <span className={styles.cornerPromptCode}>
            <CheatCodeKeys />
          </span>
        </button>
      )}
    </>
  );
}

/**
 * Hidden Konami Code Easter egg for the newsletter unsubscribe pages. Purely visual:
 * it never calls an API or changes subscription state.
 */
export default function UnsubscribalityEasterEgg() {
  const [{ phase, run }, dispatch] = useReducer(fatalityReducer, initialFatalityState);
  const [soundSupported, setSoundSupported] = useState(false);
  const [muted, setMuted] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const tapsRef = useRef<number[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const soundRef = useRef<ArcadeSound | null>(null);
  const phaseRef = useRef<FatalityPhase>(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const start = useCallback(() => {
    if (!canTrigger(phaseRef.current)) {
      return;
    }
    if (phaseRef.current === "idle") {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    // Created on the key press itself, which satisfies browser autoplay rules.
    if (!soundRef.current) {
      soundRef.current = createArcadeSound();
      setSoundSupported(soundRef.current !== null);
    }
    soundRef.current?.stop();
    setAnnouncement("");
    setHasPlayed(true);
    dispatch({ type: "trigger", reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }, []);

  const dismiss = useCallback(() => {
    soundRef.current?.stop();
    setAnnouncement("");
    dispatch({ type: "dismiss" });
  }, []);

  useKonamiCode(start);

  const handleTap = useCallback(() => {
    const result = registerTap(tapsRef.current, performance.now());
    tapsRef.current = result.taps;
    if (result.matched) {
      start();
    }
  }, [start]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowPrompt(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (consoleHintShown) {
      return;
    }
    consoleHintShown = true;
    console.info(
      `%cSUGNL%c Psst, developer. This page has a secret finisher: ${CHEAT_CODE}`,
      "background: linear-gradient(90deg, #5b3df5, #2f8bff); color: #fff; font-weight: 700; padding: 2px 6px; border-radius: 4px;",
      "color: inherit; font-weight: 600;"
    );
  }, []);

  // Live regions only announce changes: start() clears the text, and it is filled in a
  // frame later, once the (empty) region exists. This also re-announces identical replays.
  useEffect(() => {
    if (phase === "idle") {
      return;
    }
    const frame = window.requestAnimationFrame(() => setAnnouncement(ANNOUNCEMENTS[phase]));
    return () => window.cancelAnimationFrame(frame);
  }, [phase, run]);

  // Advance through the timed phases; one timeout per phase, always cleared.
  useEffect(() => {
    const duration = PHASE_DURATIONS_MS[phase];
    if (duration === undefined) {
      return;
    }
    const timeout = window.setTimeout(() => dispatch({ type: "advance", run }), duration);
    return () => window.clearTimeout(timeout);
  }, [phase, run]);

  useEffect(() => {
    if (phase !== "idle") {
      soundRef.current?.play(phase);
    }
  }, [phase, run]);

  useEffect(() => {
    soundRef.current?.setMuted(muted);
  }, [muted, soundSupported]);

  // Open as a modal (inert background, top layer) and move focus into it on every run.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (phase === "idle" || !dialog) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    if (!dialog.contains(document.activeElement)) {
      closeButtonRef.current?.focus();
    }
  }, [phase, run]);

  // Back on the page: return focus to where the visitor was.
  useEffect(() => {
    if (phase !== "idle" || !returnFocusRef.current) {
      return;
    }
    const element = returnFocusRef.current;
    returnFocusRef.current = null;
    if (element.isConnected) {
      element.focus();
    }
  }, [phase]);

  // Briefly glitch the real unsubscribe page behind the overlay.
  useEffect(() => {
    if (phase !== "activated") {
      return;
    }
    const main = document.querySelector("main");
    main?.classList.add(styles.pageGlitch);
    return () => main?.classList.remove(styles.pageGlitch);
  }, [phase, run]);

  useEffect(
    () => () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    },
    []
  );

  return (
    <>
      <CheatCodeHints showPrompt={showPrompt && !hasPlayed} onTap={handleTap} />
      {phase !== "idle" && (
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-label="Unsubscribality Easter egg"
          onCancel={(event) => {
            event.preventDefault();
            dismiss();
          }}
          onClose={dismiss}
        >
          <p className="sr-only" aria-live="assertive">
            {announcement}
          </p>

          <div key={run} className={`${styles.root} ${arcadeFont.className}`} data-phase={phase}>
            <div className={styles.shaker} aria-hidden="true">
              <div className={styles.stage}>
                <div className={styles.spotlight} />
                <div className={styles.floor} />
                <div className={styles.horizon} />
                <div className={`${styles.scanline} ${styles.scanlineBlue}`} />
                <div className={`${styles.scanline} ${styles.scanlineViolet}`} />
              </div>

              <div className={styles.hud}>
                <div>
                  <p className={styles.hudLabel}>YOUR INBOX</p>
                  <div className={styles.bar}>
                    <div className={styles.barFill} />
                  </div>
                </div>
                <span className={styles.versus}>VS</span>
                <div className={styles.hudRight}>
                  <p className={styles.hudLabel}>SUGNL NEWSLETTER</p>
                  <div className={styles.bar}>
                    <div className={`${styles.barFill} ${styles.enemyFill}`} />
                  </div>
                </div>
              </div>

              <p className={styles.unlock}>SECRET FINISHER UNLOCKED</p>
              <p className={styles.finishIt}>FINISH IT!</p>

              <div className={styles.anchor}>
                <div className={styles.fighter}>
                  <PixelNewsletter className={styles.fighterBody} />
                  <span className={styles.sweat} />
                </div>
                <div className={`${styles.shockwave} ${styles.shockViolet}`} />
                <div className={`${styles.shockwave} ${styles.shockBlue}`} />
                <div className={styles.particles}>
                  {PARTICLES.map((particle, index) => (
                    <span
                      key={index}
                      className={styles.particle}
                      style={cssVars({
                        "--dx": `${particle.dx}px`,
                        "--dy": `${particle.dy}px`,
                        "--rot": `${particle.rotation}deg`,
                        "--size": `${particle.size}px`,
                        "--color": particle.color,
                        "--delay": `${particle.delay}ms`,
                      })}
                    />
                  ))}
                </div>
                <div className={styles.striker}>
                  <span className={styles.strikeButton}>UNSUBSCRIBE</span>
                  <PixelCursor className={styles.strikeCursor} />
                </div>
              </div>
            </div>

            <div className={styles.victory}>
              {SPARKLES.map((sparkle, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className={styles.sparkle}
                  style={cssVars({
                    "--x": `${sparkle.x}%`,
                    "--size": `${sparkle.size}px`,
                    "--color": sparkle.color,
                    "--delay": `${sparkle.delay}ms`,
                  })}
                />
              ))}
              <h2 className={styles.victoryTitle}>UNSUBSCRIBALITY!</h2>
              <p className={styles.victoryLine} style={cssVars({ "--delay": "380ms" })}>
                NEWSLETTER ELIMINATED
              </p>
              <p className={styles.victoryLine} style={cssVars({ "--delay": "600ms" })}>
                YOUR INBOX WINS.
              </p>
              <p className={styles.flawless}>FLAWLESS UNSUBSCRIBE</p>
              <p className={styles.disclaimer}>
                Just a cheat code: this animation didn&apos;t change your subscription.
              </p>
              <div className={styles.actions}>
                <button type="button" onClick={start} className={`${styles.actionButton} ${styles.actionPrimary}`}>
                  Play again
                </button>
                <button type="button" onClick={dismiss} className={styles.actionButton}>
                  Back to the page
                </button>
              </div>
            </div>
          </div>

          <div className={styles.controls}>
            {soundSupported && (
              <button
                type="button"
                onClick={() => setMuted((value) => !value)}
                aria-pressed={!muted}
                className={styles.controlButton}
              >
                {muted ? "Sound off" : "Sound on"}
              </button>
            )}
            <button ref={closeButtonRef} type="button" onClick={dismiss} className={styles.controlButton}>
              Close <kbd className={styles.kbd}>Esc</kbd>
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
