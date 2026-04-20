import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Supabase Auth cookie format: sb-{project-refresh}-auth-token
  const supabaseCookie = request.cookies.get("sb-dzvlapvemyyyppcdrnnn-auth-token");
  const hasSession = !!supabaseCookie;

  const isLoginPage = request.nextUrl.pathname === "/login";
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isRoot = request.nextUrl.pathname === "/";

  if (isRoot) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!hasSession && !isLoginPage && !isApiAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
