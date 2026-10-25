import { NextRequest, NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/newsletter";
import { featureFlags } from "@/lib/featureFlags";

export async function POST(request: NextRequest) {
  if (!featureFlags.newsletter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { token } = await request.json();
    if (typeof token !== "string" || token === "") {
      return NextResponse.json({ error: "Missing token." }, { status: 400 });
    }

    if (!(await confirmSubscription(token))) {
      return NextResponse.json(
        { error: "This link is invalid or has expired. Please subscribe again." },
        { status: 410 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Newsletter confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
