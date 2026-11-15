import { NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase/server";
import { isSafeRedirect } from "@/lib/auth/permissions";

/**
 * Supabase Auth Callback Handler
 * Exchanges the auth code for a secure session token and redirects safely.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  // Sanitize target destination to prevent Open Redirect attacks
  const safeRedirectPath = isSafeRedirect(next) ? next : "/dashboard";

  if (code) {
    const supabase = await createServerSideClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeRedirectPath, requestUrl.origin));
    }
  }

  // If code exchange failed or was missing, redirect to login with error indicator
  const errorUrl = new URL("/login", requestUrl.origin);
  errorUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(errorUrl);
}
