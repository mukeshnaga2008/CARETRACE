import { NextResponse } from "next/server";
import { patientPreferencesSchema } from "@/lib/validations/patient-profile.schema";
import { INITIAL_PATIENT_PREFERENCES } from "@/lib/data/patient-profile-data";
import { PatientPreferences } from "@/types/caretrace";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

let cachedPreferences: PatientPreferences = { ...INITIAL_PATIENT_PREFERENCES };

export async function GET() {
  return NextResponse.json({
    success: true,
    preferences: cachedPreferences,
  });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  if (demoRole === "caregiver") {
    return NextResponse.json(
      { error: "Caregivers cannot update patient communication or accessibility preferences." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = patientPreferencesSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    cachedPreferences = {
      ...cachedPreferences,
      preferredName: data.preferredName,
      preferredLanguage: data.preferredLanguage,
      preferredCommunicationMethod: data.preferredCommunicationMethod,
      timeFormat: data.timeFormat,
      largerText: data.largerText,
      highContrast: data.highContrast,
      reducedMotion: data.reducedMotion,
      voiceReadoutEnabled: data.voiceReadoutEnabled,
      timezone: data.timezone,
      accessibilityNotes: data.accessibilityNotes || undefined,
      notificationPreferences: data.notificationPreferences,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Patient preferences saved successfully.",
      preferences: cachedPreferences,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update patient preferences." },
      { status: 500 }
    );
  }
}
