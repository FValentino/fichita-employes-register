import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.MOBILE_CORS_ALLOW_NGROK === "true") {
    if (/^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/.test(origin)) return true;
  }
  if (process.env.MOBILE_CORS_ALLOW_ALL === "true") return true;
  return false;
}

function setCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  const allowedOrigins = getAllowedOrigins();
  if (isOriginAllowed(origin, allowedOrigins)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
  } else if (allowedOrigins.length === 1) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-App-Key");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // Handle CORS preflight for API routes
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response, origin);
  }

  // Add CORS headers to API responses
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    setCorsHeaders(response, origin);
    
    // Continue with auth checks...
    const supabaseCookie = request.cookies.get("sb-dzvlapvemyyyppcdrnnn-auth-token");
    const hasSession = !!supabaseCookie;
    const isApiAuth = pathname.startsWith("/api/auth");
    
    if (!hasSession && !isApiAuth) {
      // Allow unauthenticated access to some mobile API routes
      const publicMobileRoutes = ["/api/mobile/qr/verify"];
      const isPublicRoute = publicMobileRoutes.some((route) => pathname.startsWith(route));
      if (!isPublicRoute) {
        return setCorsHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
          origin
        );
      }
    }
    
    return response;
  }

  // Original middleware logic for non-API routes
  const supabaseCookie = request.cookies.get("sb-dzvlapvemyyyppcdrnnn-auth-token");
  const hasSession = !!supabaseCookie;

  const isLoginPage = pathname === "/login";
  const isRoot = pathname === "/";
  const isEmployeeRoute = ["/home", "/scanner", "/hours", "/justifications", "/profile"].some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isRoot) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (hasSession && pathname.startsWith("/dashboard") && isEmployeeRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
