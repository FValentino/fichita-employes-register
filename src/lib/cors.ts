import { NextResponse } from "next/server";

const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8081",
];

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.MOBILE_CORS_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return DEFAULT_ORIGINS;
}

function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;

  // Allow if origin matches any allowed origin
  if (allowedOrigins.includes(origin)) return true;

  // Allow ngrok URLs if MOBILE_CORS_ALLOW_NGROK is set
  if (process.env.MOBILE_CORS_ALLOW_NGROK === "true") {
    if (/^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/.test(origin)) {
      return true;
    }
  }

  // Allow any origin if MOBILE_CORS_ALLOW_ALL is set (dev only!)
  if (process.env.MOBILE_CORS_ALLOW_ALL === "true") {
    return true;
  }

  return false;
}

export function setCorsHeaders(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  if (isOriginAllowed(origin, allowedOrigins)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
  } else if (allowedOrigins.length === 1) {
    // If only one origin, use it directly
    response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-App-Key");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

export function handleCorsOptions(request: Request): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response, request);
}
