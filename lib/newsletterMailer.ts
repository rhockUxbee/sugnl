import path from "node:path";
import { after } from "next/server";
import nodemailer, { type Transporter } from "nodemailer";
import type { NewsletterEmail } from "@/lib/newsletter";
import { siteUrl } from "@/lib/siteUrl";

// Transactional email only; Newsletters are never sent from the website.
// See docs/adr/0003-transactional-email-via-transip-smtp.md
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
      throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD.");
    }

    const port = Number(SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }

  return transporter;
}

function link(path: string, token?: string): string {
  const url = new URL(path, siteUrl);
  // Tokens travel in the fragment so they never reach server or analytics logs.
  if (token) {
    url.hash = `token=${token}`;
  }

  return url.toString();
}

interface Content {
  subject: string;
  heading: string;
  body: string;
  button?: { label: string; url: string };
  note: string;
}

function compose(email: NewsletterEmail): Content {
  switch (email.kind) {
    case "confirm-subscription":
      return {
        subject: "Confirm your SUGNL newsletter subscription",
        heading: "Confirm your subscription",
        body: "Someone (hopefully you) asked to receive the SUGNL newsletter at this address. Please confirm within 7 days.",
        button: { label: "Confirm subscription", url: link("/newsletter/confirm", email.token) },
        note: "Didn't ask for this? Ignore this email and we'll forget your address within 7 days.",
      };
    case "already-subscribed":
      return {
        subject: "You're already subscribed to the SUGNL newsletter",
        heading: "You're already subscribed",
        body: "Someone (hopefully you) tried to subscribe this address to the SUGNL newsletter, but it is already subscribed. No action is needed.",
        note: "Didn't ask for this? You can safely ignore this email.",
      };
  }
}

const FOOTER = "SUGNL - Sitecore User Group Netherlands";

function renderText({ heading, body, button, note }: Content, unsubscribeUrl: string): string {
  return [
    heading,
    "",
    body,
    ...(button ? ["", `${button.label}: ${button.url}`] : []),
    "",
    note,
    "",
    `Unsubscribe at any time: ${unsubscribeUrl}`,
    "",
    FOOTER,
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const LOGO_CID = "sugnl-logo";

// Table layout and inline styles: the only styling email clients render reliably.
// Colors mirror the site's dark theme (app/globals.css) and gradient button (components/newsletter/styles.ts).
function renderHtml({ heading, body, button, note }: Content, unsubscribeUrl: string): string {
  const bodyFont = "font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  const headingFont = "font-family:Sora,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  const buttonHtml = button
    ? `<p style="margin:28px 0;"><a href="${escapeHtml(button.url)}" style="display:inline-block;background-color:#4f6dff;background-image:linear-gradient(90deg,#5b3df5,#2f8bff);color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:999px;">${escapeHtml(button.label)} &rarr;</a></p>
<p style="margin:0 0 20px;font-size:13px;color:#a3afc2;">Button not working? Copy this link into your browser:<br><a href="${escapeHtml(button.url)}" style="color:#6bb8ff;word-break:break-all;">${escapeHtml(button.url)}</a></p>`
    : "";

  return `<!doctype html>
<html><head><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>
<body style="margin:0;padding:0;background:#0e1320;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e1320;${bodyFont}">
<tr><td style="background:#090d17;border-bottom:1px solid #1c2538;padding:20px 24px;" align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td>
<a href="${escapeHtml(siteUrl.toString())}"><img src="cid:${LOGO_CID}" alt="SUGNL - Sitecore User Group Nederland" width="200" style="display:block;width:200px;height:auto;border:0;color:#f5f8ff;"></a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141b2a;border:1px solid #2a3550;border-radius:16px;">
<tr><td style="padding:36px 32px;color:#e7edf8;font-size:16px;line-height:1.6;">
<p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#2fa8ff;">SUGNL Newsletter</p>
<h1 style="margin:0 0 16px;${headingFont}font-size:28px;line-height:1.2;font-weight:700;color:#e7edf8;">${escapeHtml(heading)}</h1>
<p style="margin:0;color:#a3afc2;">${escapeHtml(body)}</p>
${buttonHtml}
<p style="margin:20px 0 0;font-size:14px;color:#a3afc2;">${escapeHtml(note)}</p>
</td></tr>
</table>
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a3afc2;">${FOOTER}<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#6bb8ff;">Unsubscribe</a></p>
</td></tr>
</table>
</body></html>`;
}

export async function sendNewsletterEmail(email: NewsletterEmail): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const content = compose(email);
  const unsubscribeUrl = link("/newsletter/unsubscribe");

  await getTransporter().sendMail({
    from,
    to: email.email,
    subject: content.subject,
    text: renderText(content, unsubscribeUrl),
    html: renderHtml(content, unsubscribeUrl),
    // Embedded, not linked: remote images are blocked by default in many clients and never load from localhost.
    attachments: [{ filename: "sugnl-logo.png", path: path.join(process.cwd(), "public", "sugnl-logo.png"), cid: LOGO_CID }],
  });
}

/**
 * Sends after the response, so response time does not reveal the address's state.
 * Failures are logged without the error object, which can contain the address.
 */
export function sendNewsletterEmailAfterResponse(email: NewsletterEmail): void {
  after(() =>
    sendNewsletterEmail(email).catch((error: { code?: string; responseCode?: number }) =>
      console.error("Newsletter email failed:", email.kind, error?.code, error?.responseCode)
    )
  );
}
