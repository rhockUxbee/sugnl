import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isEventPast } from "./eventDate.ts";

describe("isEventPast", () => {
  test("is upcoming on the event day itself", () => {
    assert.equal(isEventPast("2026-10-28", new Date("2026-10-28T21:59:00Z")), false);
  });

  test("is past once the next day starts in Amsterdam, even if UTC is still on the event day", () => {
    assert.equal(isEventPast("2026-10-28", new Date("2026-10-28T23:30:00Z")), true);
  });

  test("is upcoming before the event day", () => {
    assert.equal(isEventPast("2026-10-28", new Date("2026-10-27T12:00:00Z")), false);
  });
});
