# Admin sign-in with GitHub OAuth and an ID allowlist

The admin pages (which expose the Subscriber list) are protected by "Sign in with GitHub" via Auth.js, admitting only GitHub numeric user IDs listed in a Vercel environment variable. The repository is public, so the allowlist lives only in environment configuration, never in code, and uses IDs rather than email addresses. GitHub was chosen because organizers already have accounts with 2FA, it adds no passwords or sign-in tables to our database, and each access is attributable to one person.

## Considered Options

- **Email magic link to an allowlisted address**: viable fallback, but makes mailbox security the admin security and needs a token table.
- **Shared Basic Auth password**: rejected; no 2FA, no individual accountability, unsuitable for personal data.
- **Microsoft Entra ID**: ties admin access to one employer's tenant.
