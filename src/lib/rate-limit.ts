/**
 * Rate limiter — in-memory implementation.
 *
 * ⚠️  SERVERLESS LIMITATION: In Vercel/serverless deployments, each function
 * invocation may start a fresh Node.js process. The in-memory Map does NOT
 * persist across invocations or instances, so an attacker hitting multiple
 * cold starts can bypass the limit.
 *
 * For production, replace this with an external store:
 *   - Upstash Redis (recommended for Vercel): https://upstash.com/blog/rate-limiting-nextjs
 *   - Vercel KV (Redis-based)
 *   - A Supabase table with TTL cleanup
 *
 * With 10 employees (~600 requests/month), the risk is low. But if the app
 * scales or faces external traffic, migrate to Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// NOTE: setInterval does NOT work reliably in serverless — the process
// may be garbage-collected after the request. The cleanup below runs
// opportunistically on each request instead.
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupExpired();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

// Preset configurations
export const RATE_LIMITS = {
  // Auth endpoints: 5 requests per minute
  auth: { windowMs: 60 * 1000, maxRequests: 5 },
  // Attendance: 30 requests per minute (frequent check-ins)
  attendance: { windowMs: 60 * 1000, maxRequests: 30 },
  // QR verify: 20 requests per minute
  qr: { windowMs: 60 * 1000, maxRequests: 20 },
  // WebAuthn ceremonies (options/verify): 10 requests per minute
  webauthn: { windowMs: 60 * 1000, maxRequests: 10 },
  // General API: 60 requests per minute
  general: { windowMs: 60 * 1000, maxRequests: 60 },
} as const;
