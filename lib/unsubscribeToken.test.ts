import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribeToken.ts";

const SECRET = "test-secret";

describe("unsubscribe token", () => {
  test("round-trips to the email it was issued for", () => {
    const token = createUnsubscribeToken("jane@example.nl", SECRET);
    assert.equal(verifyUnsubscribeToken(token, SECRET), "jane@example.nl");
  });

  test("rejects a token signed with another secret", () => {
    const token = createUnsubscribeToken("jane@example.nl", "other-secret");
    assert.equal(verifyUnsubscribeToken(token, SECRET), null);
  });

  test("rejects a signature moved to another address", () => {
    const [, signature] = createUnsubscribeToken("jane@example.nl", SECRET).split(".");
    const forged = `${Buffer.from("john@example.nl").toString("base64url")}.${signature}`;
    assert.equal(verifyUnsubscribeToken(forged, SECRET), null);
  });

  test("rejects malformed tokens", () => {
    for (const token of ["", "abc", "a.b.c", ".", "abc."]) {
      assert.equal(verifyUnsubscribeToken(token, SECRET), null);
    }
  });
});
