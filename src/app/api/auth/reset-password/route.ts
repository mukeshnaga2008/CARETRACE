import { NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { password } = parseResult.data;
    const supabase = await createServerSideClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          error: error.message || "Failed to update password. Session may have expired.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated. You may now log in.",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password" },
      { status: 500 }
    );
  }
}
