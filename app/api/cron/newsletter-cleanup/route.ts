import { NextRequest, NextResponse } from "next/server";
import { purgeExpired } from "@/lib/newsletter";

// Invoked daily by Vercel Cron (see vercel.json), which sends CRON_SECRET as a bearer token.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const purged = await purgeExpired();
    return NextResponse.json({ success: true, purged }, { status: 200 });
  } catch (error) {
    console.error("Newsletter cleanup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
