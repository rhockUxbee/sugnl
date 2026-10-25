import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Per-IP limiter kept in memory. Best effort only: each serverless instance has
 * its own memory, so the per-address throttle in the database is what protects inboxes.
 */
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const history = new Map<string, number[]>();

  return function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (history.get(ip) ?? []).filter((ts) => now - ts < windowMs);
    recent.push(now);
    history.set(ip, recent);

    return recent.length > maxRequests;
  };
}

/** Bots often fill hidden fields. */
export function isHoneypotFilled(website: unknown): boolean {
  return typeof website === "string" && website.trim() !== "";
}

export function isSubmittedTooQuickly(submittedAt: unknown, minFormFillMs: number): boolean {
  return typeof submittedAt !== "number" || Date.now() - submittedAt < minFormFillMs;
}
