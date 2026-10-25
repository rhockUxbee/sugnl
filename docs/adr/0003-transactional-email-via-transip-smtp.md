# Transactional email via SMTP from a dedicated TransIP mailbox

Confirmation and unsubscribe emails are sent over SMTP from a dedicated TransIP mailbox (`newsletter@sugnl.net`) rather than through an email API provider. TransIP already hosts sugnl.net mail, is a Dutch company (keeping personal data in the Netherlands), and avoids a new vendor; our volume is a handful of emails per day. Because SMTP credentials are full mailbox credentials, the mailbox is dedicated to this purpose and is never a personal one.

## Considered Options

- **Resend (EU region)**: better developer experience and delivery dashboards, but a US company and an extra vendor.
- **Lettermint / Mailjet / Amazon SES**: EU-hosted alternatives; unnecessary given existing TransIP hosting.
