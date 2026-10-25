import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PageContainer from "@/components/PageContainer";
import NewsletterShowcase from "@/components/newsletter/NewsletterShowcase";
import NewsletterTokenConfirmation from "@/components/newsletter/NewsletterTokenConfirmation";
import { featureFlags } from "@/lib/featureFlags";

export const metadata: Metadata = {
  title: "Confirm Subscription | SUGNL",
  robots: { index: false, follow: false },
};

export default async function NewsletterConfirmPage() {
  if (!featureFlags.newsletter) {
    notFound();
  }

  // Render per request so the CSP nonce reaches the inline scripts that hydrate the form.
  await connection();

  return (
    <PageContainer className="py-8 md:py-12">
      <NewsletterShowcase
        title="Confirm your"
        highlight="subscription"
        description="One last step: confirm that you want to receive the SUGNL newsletter and stay up to date on events, sessions and news from the Dutch Sitecore community."
        action={
          <NewsletterTokenConfirmation
            variant="showcase"
            endpoint="/api/newsletter/confirm"
            heading="Almost there"
            text="Click the button below and you're on the list. You can unsubscribe at any time."
            buttonLabel="Confirm subscription"
            successHeading="You're subscribed!"
            successText="Thanks for joining. You'll hear from us when there's news."
          />
        }
      />
    </PageContainer>
  );
}
