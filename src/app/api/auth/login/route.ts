import { NextResponse } from "next/server";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, RATE_LIMITS.auth, "auth:login");
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  return NextResponse.json({ message: "Use client-side login" }, { status: 400 });
}