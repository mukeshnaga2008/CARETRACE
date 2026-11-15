import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSafeRedirect } from "@/lib/auth/redirects";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/medications",
  "/appointments",
  "/care-circle",
  "/instructions",
  "/continuity",
  "/care-gaps",
  "/radar",
  "/notifications",
  "/timeline",
  "/analytics",
  "/care-passport",
  "/passport",
  "/privacy",
  "/settings",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.caretrace.internal";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  // Determine if user has a live Supabase session
  let isSupabaseAuthenticated = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      isSupabaseAuthenticated = true;
    }
  } catch {
    isSupabaseAuthenticated = false;
  }

  // Determine if user has an explicit active local or demo session
  const demoRoleCookie = request.cookies.get("caretrace_demo_role")?.value;
  const sessionCookie = request.cookies.get("caretrace_session")?.value;
  const isSessionAuthenticated = Boolean(sessionCookie || demoRoleCookie);

  const isAuthenticated = isSupabaseAuthenticated || isSessionAuthenticated;

  // Root entry routing: ALWAYS route first-time visitors directly to /login
  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Enforce Protected Routes: Redirect unauthenticated requests to /login
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Add session metadata header for client and layout awareness
  supabaseResponse.headers.set(
    "x-caretrace-auth-mode",
    isSupabaseAuthenticated ? "live-supabase" : isSessionAuthenticated ? "authenticated-session" : "unauthenticated"
  );

  // Security response headers (defense-in-depth)
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  supabaseResponse.headers.set("X-XSS-Protection", "1; mode=block");

  return supabaseResponse;
}
