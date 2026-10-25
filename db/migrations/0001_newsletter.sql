-- Newsletter mailing list. See docs/adr/0001-self-hosted-newsletter-list-in-eu-postgres.md
-- Only email addresses are stored; tokens are stored as SHA-256 hashes.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  consented_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL,
  -- Throttles "you're already subscribed" emails.
  last_notified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS newsletter_pending_subscriptions (
  email TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  consented_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL
);
