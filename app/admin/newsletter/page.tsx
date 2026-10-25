import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageIntro from "@/components/PageIntro";
import PageContainer from "@/components/PageContainer";
import CopyEmailsButton from "@/components/newsletter/CopyEmailsButton";
import EraseSubscriberButton from "@/components/newsletter/EraseSubscriberButton";
import { auth } from "@/auth";
import { countPendingSubscriptions, listSubscribers } from "@/lib/newsletter";
import { featureFlags } from "@/lib/featureFlags";
import { signInWithGitHub, signOutAdmin } from "./actions";

export const metadata: Metadata = {
  title: "Newsletter Admin | SUGNL",
  robots: { index: false, follow: false },
};

const buttonClassName =
  "rounded-md bg-[color:var(--button-primary)] px-4 py-2 text-white transition-colors hover:bg-[color:var(--button-primary-hover)]";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Europe/Amsterdam",
});

interface NewsletterAdminPageProps {
  readonly searchParams: Promise<{ error?: string }>;
}

export default async function NewsletterAdminPage({ searchParams }: NewsletterAdminPageProps) {
  if (!featureFlags.newsletter) {
    notFound();
  }

  const session = await auth();

  if (!session?.isAdmin) {
    const { error } = await searchParams;
    const denied = error === "AccessDenied" || Boolean(session);

    return (
      <PageContainer className="md:py-16">
        <PageIntro title="Newsletter admin" description="Sign in with an Admin GitHub account to continue." />
        <section className="surface-card max-w-xl space-y-4 bg-[color:var(--surface-soft)] p-6 md:p-8">
          {denied && (
            <p className="rounded-md bg-[color:var(--error-bg)] p-3 text-[color:var(--error-ink)]">
              This GitHub account is not allowed to view the newsletter list.
            </p>
          )}
          {error && !denied && (
            <p className="rounded-md bg-[color:var(--error-bg)] p-3 text-[color:var(--error-ink)]">
              Signing in failed. Please try again.
            </p>
          )}
          <form action={session ? signOutAdmin : signInWithGitHub}>
            <button type="submit" className={buttonClassName}>
              {session ? "Sign out" : "Sign in with GitHub"}
            </button>
          </form>
        </section>
      </PageContainer>
    );
  }

  const [subscribers, pendingCount] = await Promise.all([
    listSubscribers(),
    countPendingSubscriptions(),
  ]);

  return (
    <PageContainer className="md:py-16">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageIntro
          title="Newsletter admin"
          description={`${subscribers.length} Subscribers · ${pendingCount} pending confirmation`}
          sectionClassName=""
        />
        <form action={signOutAdmin} className="flex items-center gap-3 text-sm text-[color:var(--muted)]">
          <span>Signed in as {session.user?.name}</span>
          <button type="submit" className="underline underline-offset-4">
            Sign out
          </button>
        </form>
      </div>

      <section className="surface-card space-y-6 bg-[color:var(--surface-soft)] p-6 md:p-8">
        <CopyEmailsButton emails={subscribers.map((subscriber) => subscriber.email)} />

        {subscribers.length === 0 ? (
          <p className="text-[color:var(--muted)]">No Subscribers yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--line)] text-[color:var(--muted)]">
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Confirmed</th>
                <th className="py-2" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.email} className="border-b border-[color:var(--line)]">
                  <td className="break-all py-2 pr-4">{subscriber.email}</td>
                  <td className="whitespace-nowrap py-2 pr-4">{dateFormat.format(subscriber.confirmedAt)}</td>
                  <td className="py-2 text-right">
                    <EraseSubscriberButton email={subscriber.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PageContainer>
  );
}
