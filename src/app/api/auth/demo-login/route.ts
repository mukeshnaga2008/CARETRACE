import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const demoLoginSchema = z.object({
  role: z.enum(["patient", "family", "caregiver", "doctor", "admin"]),
  patientId: z.string().optional(),
});

const DEMO_NAMES: Record<string, string> = {
  patient: "Margaret Sullivan",
  family: "David Sullivan",
  caregiver: "Nurse Sarah Jenkins, RN",
  doctor: "Dr. Robert Vance, MD",
  admin: "System Administrator",
};

export async function POST(request: Request) {
  // Only permit demo login if DEMO_MODE is explicitly enabled
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Demo evaluation mode is disabled in production environments" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = demoLoginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid demo role selected" }, { status: 400 });
    }

    const { role, patientId } = parseResult.data;
    const cookieStore = await cookies();
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const activePatient = patientId || "DEMO-001";

    // Set secure demo session cookies
    cookieStore.set("caretrace_demo_role", role, {
      httpOnly: false, // Accessible to client-side perspective switcher
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set("caretrace_session", `demo-active-${role}-${Date.now()}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set("caretrace_user_name", DEMO_NAMES[role] || "Demo User", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set("caretrace_user_email", `${role}@caretrace.health`, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    cookieStore.set("caretrace_active_patient", activePatient, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return NextResponse.json({
      success: true,
      role,
      patientId: activePatient,
      message: `Signed in to demo evaluation session as ${role}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to establish demo session" },
      { status: 500 }
    );
  }
}
