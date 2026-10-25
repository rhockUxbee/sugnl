import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PageContainer from "@/components/PageContainer";
import NewsletterEmailForm from "@/components/newsletter/NewsletterEmailForm";
import NewsletterShowcase, { unsubscribeBenefits } from "@/components/newsletter/NewsletterShowcase";
import UnsubscribalityEasterEgg from "@/components/newsletter/unsubscribality/UnsubscribalityEasterEgg";
import { featureFlags } from "@/lib/featureFlags";

export const metadata: Metadata = {
  title: "Unsubscribe | SUGNL",
  description: "Unsubscribe from the SUGNL newsletter.",
};

export default async function NewsletterUnsubscribePage() {
  if (!featureFlags.newsletter) {
    notFound();
  }

  // Render per request so the CSP nonce reaches the inline scripts that hydrate the form.
  await connection();

  return (
    <PageContainer className="py-8 md:py-12">
      <NewsletterShowcase
        title="Leave the SUGNL"
        highlight="newsletter"
        description="Enter your email address and we erase it from our list right away."
        benefitsTitle="Good to know"
        benefits={unsubscribeBenefits}
        action={
          <>
            <NewsletterEmailForm endpoint="/api/newsletter/unsubscribe" submitLabel="Unsubscribe" variant="showcase" />
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              Changed your mind?{" "}
              <Link href="/newsletter" className="text-[color:var(--link)] underline-offset-4 hover:underline">
                Stay subscribed
              </Link>
            </p>
            <UnsubscribalityEasterEgg />
          </>
        }
      />
    </PageContainer>
  );
}
