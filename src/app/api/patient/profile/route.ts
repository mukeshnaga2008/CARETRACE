import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { patientProfileEditSchema } from "@/lib/validations/patient-profile.schema";
import { 
  INITIAL_PATIENT_PROFILE, 
  getMaskedPatientProfile, 
  FullPatientHealthProfile 
} from "@/lib/data/patient-profile-data";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";
import { PermissionTier } from "@/types/caretrace";

// In-memory persistent cache for demo evaluation mode
let cachedProfile: FullPatientHealthProfile = { ...INITIAL_PATIENT_PROFILE };

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";
  const permissionTier: PermissionTier = demoRole === "patient" ? "full_admin" : demoRole === "family" ? "family_viewer" : "caregiver_editor";

  // Mask private fields (DOB, street address, phone) unless patient or full_admin
  const safeProfile = getMaskedPatientProfile(cachedProfile, demoRole, permissionTier);

  return NextResponse.json({
    success: true,
    profile: safeProfile,
    viewerContext: {
      role: demoRole,
      permissionTier,
      isUnmasked: demoRole === "patient" || permissionTier === "full_admin",
    },
  });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  // Permission verification: Only patient or family admin can modify profile
  if (demoRole === "caregiver") {
    return NextResponse.json(
      { error: "Caregivers have read-only access to patient health identity. Only the patient or primary family administrator can edit." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = patientProfileEditSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updates = parseResult.data;

    // Apply updates
    cachedProfile = {
      ...cachedProfile,
      fullName: updates.fullName,
      preferredName: updates.preferredName,
      phoneNumber: updates.phoneNumber || cachedProfile.phoneNumber,
      email: updates.email || cachedProfile.email,
      addressLine1: updates.addressLine1 || cachedProfile.addressLine1,
      addressCity: updates.addressCity || cachedProfile.addressCity,
      addressState: updates.addressState || cachedProfile.addressState,
      addressZip: updates.addressZip || cachedProfile.addressZip,
      preferredLanguage: updates.preferredLanguage,
      bloodType: updates.bloodType,
      primaryDoctorName: updates.primaryDoctorName || cachedProfile.primaryDoctorName,
      primaryClinic: updates.primaryClinic || cachedProfile.primaryClinic,
      lastReviewedAt: new Date().toISOString(),
      lastReviewedByName: demoRole === "patient" ? cachedProfile.fullName : "David Sullivan (Family Admin)",
      lastReviewedByRole: demoRole === "patient" ? "Patient" : "Family Care Coordinator",
    };

    return NextResponse.json({
      success: true,
      message: "Patient health profile updated successfully.",
      profile: cachedProfile,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update patient profile." },
      { status: 500 }
    );
  }
}
