import { NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = forgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;
    const origin = new URL(request.url).origin;

    // Send reset instructions through Supabase Auth
    try {
      const supabase = await createServerSideClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
    } catch {
      // Catch silently to guarantee that user-enumeration is prevented
    }

    // Always return a neutral, uniform response to prevent user account enumeration
    return NextResponse.json({
      success: true,
      message:
        "If that email address is registered with CARETRACE, password reset instructions have been sent.",
    });
  } catch {
    return NextResponse.json(
      {
        success: true,
        message:
          "If that email address is registered with CARETRACE, password reset instructions have been sent.",
      },
      { status: 200 }
    );
  }
}
