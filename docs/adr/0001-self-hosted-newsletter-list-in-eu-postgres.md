# Self-hosted newsletter list in EU Postgres instead of Brevo

We keep the newsletter list in our own Postgres database (Neon, EU/Frankfurt region, via the Vercel Marketplace) instead of the earlier Brevo integration, because we want to own the subscriber data and the code. To keep GDPR obligations small we store only the email address (no name), use double opt-in, erase a Subscriber completely and immediately on Unsubscribe (no email confirmation, so withdrawing consent is as easy as giving it), and erase Pending Subscriptions after 7 days. The website sends only transactional emails (subscription confirmation links); Newsletters themselves are sent from outside the website using the Subscriber Export.

## Considered Options

- **Brevo as the store**: rejected; it would hold the subscriber data and lock sending to Brevo, which we did not want.
- **Upstash Redis**: native TTL suits expiry, but uniqueness and listing must be hand-built and there is no schema.
- **Supabase**: comparable Postgres, but another platform to manage outside Vercel.
