import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { advanceKonami, KONAMI_SEQUENCE, shouldIgnoreKeyEvent } from "./konamiCode.ts";
import type { KeyEventLike } from "./konamiCode.ts";

function feed(keys: readonly string[]): { progress: number; matches: number } {
  let progress = 0;
  let matches = 0;
  for (const key of keys) {
    const result = advanceKonami(progress, key);
    progress = result.progress;
    if (result.matched) {
      matches++;
    }
  }
  return { progress, matches };
}

const keyEvent = (overrides: Partial<KeyEventLike> = {}): KeyEventLike => ({
  key: "a",
  repeat: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  target: null,
  ...overrides,
});

describe("advanceKonami", () => {
  test("matches the full sequence exactly once and resets", () => {
    assert.deepEqual(feed(KONAMI_SEQUENCE), { progress: 0, matches: 1 });
  });

  test("only the final key reports a match", () => {
    let progress = 0;
    KONAMI_SEQUENCE.forEach((key, index) => {
      const result = advanceKonami(progress, key);
      assert.equal(result.matched, index === KONAMI_SEQUENCE.length - 1);
      progress = result.progress;
    });
  });

  test("letters are case-insensitive", () => {
    assert.equal(feed([...KONAMI_SEQUENCE.slice(0, 8), "B", "A"]).matches, 1);
  });

  test("a wrong key resets progress", () => {
    assert.deepEqual(feed(["ArrowUp", "ArrowUp", "ArrowDown", "x"]), { progress: 0, matches: 0 });
  });

  test("a wrong key that starts the sequence keeps it started", () => {
    assert.equal(feed(["ArrowUp", "ArrowDown", "ArrowUp"]).progress, 1);
  });

  test("an extra leading key still lets the code complete (↑ ↑ ↑ ↓ ↓ …)", () => {
    assert.equal(feed(["ArrowUp", ...KONAMI_SEQUENCE]).matches, 1);
  });

  test("entering the code twice matches twice (replay)", () => {
    assert.equal(feed([...KONAMI_SEQUENCE, ...KONAMI_SEQUENCE]).matches, 2);
  });

  test("an incomplete or out-of-order sequence never matches", () => {
    assert.equal(feed(KONAMI_SEQUENCE.slice(0, 9)).matches, 0);
    assert.equal(feed([...KONAMI_SEQUENCE.slice(0, 8), "a", "b"]).matches, 0);
  });
});

describe("shouldIgnoreKeyEvent", () => {
  test("accepts a plain key press", () => {
    assert.equal(shouldIgnoreKeyEvent(keyEvent()), false);
  });

  test("ignores key repeats", () => {
    assert.equal(shouldIgnoreKeyEvent(keyEvent({ repeat: true })), true);
  });

  test("ignores modifier combinations", () => {
    for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const) {
      assert.equal(shouldIgnoreKeyEvent(keyEvent({ [modifier]: true })), true, modifier);
    }
  });

  test("ignores typing in form fields and editable elements", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT", "input"]) {
      assert.equal(shouldIgnoreKeyEvent(keyEvent({ target: { tagName } })), true, tagName);
    }
    assert.equal(shouldIgnoreKeyEvent(keyEvent({ target: { tagName: "DIV", isContentEditable: true } })), true);
  });

  test("accepts key presses on buttons and the page body", () => {
    assert.equal(shouldIgnoreKeyEvent(keyEvent({ target: { tagName: "BUTTON" } })), false);
    assert.equal(shouldIgnoreKeyEvent(keyEvent({ target: { tagName: "BODY", isContentEditable: false } })), false);
  });
});
