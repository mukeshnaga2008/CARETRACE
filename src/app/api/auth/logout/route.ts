import { NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const supabase = await createServerSideClient();
    await supabase.auth.signOut();
  } catch {
    // Continue cleanup even if supabase call fails
  }

  // Clear demo session cookies
  const cookieStore = await cookies();
  cookieStore.delete("caretrace_demo_role");
  cookieStore.delete("caretrace_session");

  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
}
