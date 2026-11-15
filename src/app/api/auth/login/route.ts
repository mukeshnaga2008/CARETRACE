import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSideClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth.schema";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { authenticateUser } from "@/lib/auth/registered-users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parseResult.data;

    // Rate limit: max 10 login attempts per minute per email
    const rateLimit = checkRateLimit(`login_attempt_${email.toLowerCase()}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many failed login attempts. Please wait a minute before trying again.",
          retryAfterSeconds: rateLimit.resetSeconds,
        },
        { status: 429 }
      );
    }

    let cookieStore: any = null;
    try {
      cookieStore = await cookies();
    } catch {
      // Standalone test runner fallback
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

    // 1. Try Supabase Auth if external Supabase is reachable
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isLiveSupabase = supabaseUrl && !supabaseUrl.includes("demo.caretrace.internal");

    if (isLiveSupabase) {
      try {
        const supabase = await createServerSideClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!error && data.user) {
          const resp = NextResponse.json({
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email,
            },
          });

          if (cookieStore) {
            cookieStore.set("caretrace_session", `supabase-${data.user.id}-${Date.now()}`, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge,
            });
          }

          resp.cookies.set("caretrace_session", `supabase-${data.user.id}-${Date.now()}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge,
          });

          return resp;
        }
      } catch {
        // Fall back to registered user store
      }
    }

    // 2. Check CARETRACE Registered & Synthetic User Repository
    const verifiedUser = authenticateUser(email, password);

    if (!verifiedUser) {
      return NextResponse.json(
        {
          error: "Invalid email or password",
          message: "Please verify your email and password.",
        },
        { status: 401 }
      );
    }

    // Set authenticated session cookies
    if (cookieStore) {
      try {
        cookieStore.set("caretrace_demo_role", verifiedUser.role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });

        cookieStore.set("caretrace_session", `auth-active-${verifiedUser.id}-${Date.now()}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });

        cookieStore.set("caretrace_user_name", verifiedUser.fullName, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });

        cookieStore.set("caretrace_user_email", verifiedUser.email, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });

        cookieStore.set("caretrace_active_patient", verifiedUser.patientId || "DEMO-001", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });
      } catch {
        // Fallback
      }
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        fullName: verifiedUser.fullName,
        role: verifiedUser.role,
        patientId: verifiedUser.patientId || "DEMO-001",
      },
      message: `Signed in successfully as ${verifiedUser.fullName}`,
    });

    response.cookies.set("caretrace_demo_role", verifiedUser.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("caretrace_session", `auth-active-${verifiedUser.id}-${Date.now()}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("caretrace_user_name", verifiedUser.fullName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("caretrace_user_email", verifiedUser.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("caretrace_active_patient", verifiedUser.patientId || "DEMO-001", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication" },
      { status: 500 }
    );
  }
}
