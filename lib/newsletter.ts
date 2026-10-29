import { createHash, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

// Domain rules: see GLOSSARY.md (Newsletter section).
const PENDING_SUBSCRIPTION_TTL = "7 days";
const EMAIL_THROTTLE = "5 minutes";
const MAX_EMAIL_LENGTH = 254;

export interface Subscriber {
  email: string;
  confirmedAt: Date;
}

/** An email the website must send as the outcome of a request. */
export type NewsletterEmail =
  | { kind: "confirm-subscription"; email: string; token: string }
  | { kind: "already-subscribed"; email: string }
  | { kind: "confirm-unsubscribe"; email: string };

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  // Strict addr-spec only: display names, comments and lists (e.g. "x<a@b.nl>") would
  // reach the same inbox under a different key and bypass the per-address throttle.
  if (
    email.length > MAX_EMAIL_LENGTH ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(email)
  ) {
    return null;
  }

  return email;
}

function createToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Records a request to subscribe. Returns the email to send, or null when an
 * email was sent to this address too recently.
 */
export async function requestSubscription(email: string): Promise<NewsletterEmail | null> {
  const sql = getSql();

  const subscribers = await sql`
    SELECT email FROM newsletter_subscribers WHERE email = ${email}
  `;

  if (subscribers.length > 0) {
    const notified = await sql`
      UPDATE newsletter_subscribers
      SET last_notified_at = now()
      WHERE email = ${email}
        AND (last_notified_at IS NULL OR last_notified_at < now() - ${EMAIL_THROTTLE}::interval)
      RETURNING email
    `;

    return notified.length > 0 ? { kind: "already-subscribed", email } : null;
  }

  // A repeated request issues a fresh link and restarts the expiry, unless throttled.
  const { token, tokenHash } = createToken();
  const pending = await sql`
    INSERT INTO newsletter_pending_subscriptions (email, token_hash, consented_at, expires_at, last_sent_at)
    VALUES (${email}, ${tokenHash}, now(), now() + ${PENDING_SUBSCRIPTION_TTL}::interval, now())
    ON CONFLICT (email) DO UPDATE
      SET token_hash = EXCLUDED.token_hash,
          consented_at = EXCLUDED.consented_at,
          expires_at = EXCLUDED.expires_at,
          last_sent_at = EXCLUDED.last_sent_at
      WHERE newsletter_pending_subscriptions.last_sent_at < now() - ${EMAIL_THROTTLE}::interval
    RETURNING email
  `;

  return pending.length > 0 ? { kind: "confirm-subscription", email, token } : null;
}

/** Turns the Pending Subscription for this token into a Subscriber. */
export async function confirmSubscription(token: string): Promise<boolean> {
  const sql = getSql();

  const confirmed = await sql`
    WITH pending AS (
      DELETE FROM newsletter_pending_subscriptions
      WHERE token_hash = ${hashToken(token)} AND expires_at > now()
      RETURNING email, consented_at
    )
    INSERT INTO newsletter_subscribers (email, consented_at, confirmed_at)
    SELECT email, consented_at, now() FROM pending
    ON CONFLICT (email) DO UPDATE SET confirmed_at = newsletter_subscribers.confirmed_at
    RETURNING email
  `;

  return confirmed.length > 0;
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const sql = getSql();

  const rows = await sql`
    SELECT email, confirmed_at FROM newsletter_subscribers ORDER BY confirmed_at DESC
  `;

  return rows.map((row) => ({
    email: String(row.email),
    confirmedAt: new Date(row.confirmed_at),
  }));
}

export async function countPendingSubscriptions(): Promise<number> {
  const sql = getSql();

  const [row] = await sql`
    SELECT count(*)::int AS count FROM newsletter_pending_subscriptions WHERE expires_at > now()
  `;

  return Number(row?.count ?? 0);
}

function getUnsubscribeSecret(): string {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("NEWSLETTER_UNSUBSCRIBE_SECRET is not set.");
  }

  return secret;
}

/** The token for this address's personal unsubscribe link. */
export function getUnsubscribeToken(email: string): string {
  return createUnsubscribeToken(email, getUnsubscribeSecret());
}

/**
 * Records a request to unsubscribe from the unsubscribe page. Returns the email with the
 * personal unsubscribe link, or null for an unknown or too recently notified address.
 */
export async function requestUnsubscribe(email: string): Promise<NewsletterEmail | null> {
  const sql = getSql();

  const notified = await sql`
    UPDATE newsletter_subscribers
    SET last_notified_at = now()
    WHERE email = ${email}
      AND (last_notified_at IS NULL OR last_notified_at < now() - ${EMAIL_THROTTLE}::interval)
    RETURNING email
  `;

  return notified.length > 0 ? { kind: "confirm-unsubscribe", email } : null;
}

/** Erases the address a personal unsubscribe link was issued for. */
export async function unsubscribeWithToken(token: string): Promise<boolean> {
  const email = verifyUnsubscribeToken(token, getUnsubscribeSecret());
  if (!email) {
    return false;
  }

  await eraseSubscriber(email);
  return true;
}

/** Erases every record of an email address (GDPR right to erasure). */
export async function eraseSubscriber(email: string): Promise<void> {
  const sql = getSql();

  await sql.transaction([
    sql`DELETE FROM newsletter_subscribers WHERE email = ${email}`,
    sql`DELETE FROM newsletter_pending_subscriptions WHERE email = ${email}`,
  ]);
}

/** Erases expired Pending Subscriptions. */
export async function purgeExpired(): Promise<{ pendingSubscriptions: number }> {
  const sql = getSql();

  const pending = await sql`
    DELETE FROM newsletter_pending_subscriptions WHERE expires_at <= now() RETURNING email
  `;

  return { pendingSubscriptions: pending.length };
}
