import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, RATE_LIMITS, type RateLimitConfig } from "@/lib/rate-limit";

export function withRateLimit(
  request: Request,
  config: RateLimitConfig,
  keyPrefix: string
): { allowed: boolean; response?: NextResponse } {
  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        }
      ),
    };
  }

  return { allowed: true };
}

export { RATE_LIMITS };
