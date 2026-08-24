import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Supabase Auth cookie format: sb-{project-refresh}-auth-token
  const supabaseCookie = request.cookies.get("sb-dzvlapvemyyyppcdrnnn-auth-token");
  const hasSession = !!supabaseCookie;

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isApiAuth = pathname.startsWith("/api/auth");
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

  if (!hasSession && !isLoginPage && !isApiAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect employee routes to dashboard if user is admin
  // (This is a simple check - in production you'd verify the role from the JWT)
  if (hasSession && pathname.startsWith("/dashboard") && isEmployeeRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
