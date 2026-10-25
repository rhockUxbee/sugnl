"use client";

import { useEffect, useRef } from "react";
import { advanceKonami, shouldIgnoreKeyEvent } from "@/lib/konamiCode";

/** Calls onMatch whenever the Konami Code is entered while the calling component is mounted. */
export function useKonamiCode(onMatch: () => void): void {
  const onMatchRef = useRef(onMatch);

  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    let progress = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyEvent(event)) {
        return;
      }
      const result = advanceKonami(progress, event.key);
      progress = result.progress;
      if (result.matched) {
        onMatchRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
