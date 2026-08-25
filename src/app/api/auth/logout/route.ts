import { NextResponse } from "next/server";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, RATE_LIMITS.auth, "auth:logout");
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });
    await supabase.auth.signOut();
  }

  const response = NextResponse.json({ success: true });

  // Clear the httpOnly role cookie server-side
  response.headers.set(
    "Set-Cookie",
    "fichita-role=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure"
  );

  return response;
}
