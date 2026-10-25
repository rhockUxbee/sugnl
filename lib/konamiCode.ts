// Pure Konami Code detection, kept free of React and the DOM so it can be unit tested.

export const KONAMI_SEQUENCE: readonly string[] = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export interface KonamiProgress {
  /** How many keys of the sequence are currently matched. */
  progress: number;
  /** True when this key completed the sequence; progress is then reset to 0. */
  matched: boolean;
}

export interface KeyEventLike {
  key: string;
  repeat: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  target: unknown;
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

/**
 * Feeds one key into the matcher. On a wrong key the matcher falls back to the
 * longest prefix that is still valid, so "↑ ↑ ↑ ↓ ↓ …" still completes the code.
 */
export function advanceKonami(
  progress: number,
  key: string,
  sequence: readonly string[] = KONAMI_SEQUENCE
): KonamiProgress {
  const typed = [...sequence.slice(0, progress), normalizeKey(key)];

  for (let length = Math.min(typed.length, sequence.length); length > 0; length--) {
    const suffix = typed.slice(typed.length - length);
    if (suffix.every((value, index) => value === sequence[index])) {
      return length === sequence.length ? { progress: 0, matched: true } : { progress: length, matched: false };
    }
  }

  return { progress: 0, matched: false };
}

function isEditableTarget(target: unknown): boolean {
  if (typeof target !== "object" || target === null) {
    return false;
  }

  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  const tagName = typeof element.tagName === "string" ? element.tagName.toUpperCase() : "";

  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || element.isContentEditable === true;
}

/** Key events that must neither advance nor reset the code: repeats, shortcuts and typing in form fields. */
export function shouldIgnoreKeyEvent(event: KeyEventLike): boolean {
  return (
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    isEditableTarget(event.target)
  );
}
