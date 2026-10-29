import { createHmac, timingSafeEqual } from "node:crypto";

// Signed, not stored: every email can carry a working unsubscribe link without a database row.
// Tokens never expire; rotating NEWSLETTER_UNSUBSCRIBE_SECRET invalidates all of them.
function sign(email: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`unsubscribe:${email}`).digest();
}

export function createUnsubscribeToken(email: string, secret: string): string {
  return `${Buffer.from(email).toString("base64url")}.${sign(email, secret).toString("base64url")}`;
}

/** Returns the email address the token was issued for, or null when it is not genuine. */
export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  const [encodedEmail, signature, ...rest] = token.split(".");
  if (!encodedEmail || !signature || rest.length > 0) {
    return null;
  }

  const email = Buffer.from(encodedEmail, "base64url").toString();
  const expected = sign(email, secret);
  const actual = Buffer.from(signature, "base64url");

  return actual.length === expected.length && timingSafeEqual(actual, expected) ? email : null;
}
