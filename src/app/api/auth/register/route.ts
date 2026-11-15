import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSideClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth.schema";
import { registerUser } from "@/lib/auth/registered-users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, role } = parseResult.data;

    // 1. Try Supabase signUp if external Supabase is reachable
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isLiveSupabase = supabaseUrl && !supabaseUrl.includes("demo.caretrace.internal");

    if (isLiveSupabase) {
      try {
        const supabase = await createServerSideClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (!error && data.user) {
          return NextResponse.json({
            success: true,
            user: { id: data.user.id, email: data.user.email },
            requiresEmailVerification: data.session === null,
          });
        }
      } catch {
        // Fall back to registered user store
      }
    }

    // 2. Register into CARETRACE User Repository
    const regResult = registerUser({
      fullName,
      email,
      password,
      role,
    });

    if (!regResult.success) {
      return NextResponse.json(
        {
          error: regResult.error,
        },
        { status: 400 }
      );
    }

    const { user } = regResult;
    let cookieStore: any = null;
    try {
      cookieStore = await cookies();
    } catch {
      // Test runner fallback
    }

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    if (cookieStore) {
      try {
        cookieStore.set("caretrace_demo_role", user.role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });

        cookieStore.set("caretrace_session", `auth-active-${user.id}-${Date.now()}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });

        cookieStore.set("caretrace_user_name", user.fullName, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge,
        });

        cookieStore.set("caretrace_user_email", user.email, {
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
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      requiresEmailVerification: false,
      message: "Account established successfully.",
    });

    response.cookies.set("caretrace_demo_role", user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("caretrace_session", `auth-active-${user.id}-${Date.now()}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("caretrace_user_name", user.fullName, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("caretrace_user_email", user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred during account registration" },
      { status: 500 }
    );
  }
}
