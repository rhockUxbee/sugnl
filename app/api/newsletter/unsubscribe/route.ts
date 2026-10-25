import { NextRequest, NextResponse } from "next/server";
import { eraseSubscriber, normalizeEmail } from "@/lib/newsletter";
import { featureFlags } from "@/lib/featureFlags";
import {
  createRateLimiter,
  getClientIp,
  isHoneypotFilled,
  isSubmittedTooQuickly,
} from "@/lib/formGuards";

const isRateLimited = createRateLimiter(10 * 60 * 1000, 6);
const MIN_FORM_FILL_MS = 2000;

// Same response whatever the address's state, so the form never reveals who is subscribed.
const NEUTRAL_RESPONSE = {
  success: true,
  message: "You're unsubscribed. If this address was on our list, it has been erased.",
};

export async function POST(request: NextRequest) {
  if (!featureFlags.newsletter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email, website, submittedAt } = await request.json();

    if (isHoneypotFilled(website)) {
      return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
    }

    if (isSubmittedTooQuickly(submittedAt, MIN_FORM_FILL_MS)) {
      return NextResponse.json(
        { error: "Form submitted too quickly. Please review and try again." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // No email round-trip: withdrawing consent must be as easy as giving it (GDPR art. 7(3)).
    await eraseSubscriber(normalizedEmail);

    return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
