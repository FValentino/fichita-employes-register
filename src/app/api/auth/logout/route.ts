import { NextResponse } from "next/server";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, RATE_LIMITS.auth, "auth:logout");
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const response = NextResponse.json({ success: true });

  // Clear the httpOnly role cookie server-side
  response.headers.set(
    "Set-Cookie",
    "fichita-role=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure"
  );

  return response;
}
