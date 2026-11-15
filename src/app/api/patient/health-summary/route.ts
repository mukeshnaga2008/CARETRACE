import { NextResponse } from "next/server";
import { 
  INITIAL_PATIENT_PROFILE, 
  INITIAL_HEALTH_SOURCES, 
  INITIAL_EMERGENCY_CONTACTS 
} from "@/lib/data/patient-profile-data";
import { 
  SYNTHETIC_MEDICATION_SCHEDULE, 
  SYNTHETIC_NEXT_APPOINTMENT, 
  SYNTHETIC_CARE_CIRCLE 
} from "@/lib/data/synthetic-dashboard-data";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

export async function GET() {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  return NextResponse.json({
    success: true,
    patient: {
      fullName: INITIAL_PATIENT_PROFILE.fullName,
      preferredName: INITIAL_PATIENT_PROFILE.preferredName,
      age: INITIAL_PATIENT_PROFILE.age,
      bloodType: INITIAL_PATIENT_PROFILE.bloodType,
      primaryDoctorName: INITIAL_PATIENT_PROFILE.primaryDoctorName,
      primaryClinic: INITIAL_PATIENT_PROFILE.primaryClinic,
      advanceDirectivesStatus: INITIAL_PATIENT_PROFILE.advanceDirectivesStatus,
      healthcareProxyName: INITIAL_PATIENT_PROFILE.healthcareProxyName,
      lastReviewedAt: INITIAL_PATIENT_PROFILE.lastReviewedAt,
      lastReviewedByName: INITIAL_PATIENT_PROFILE.lastReviewedByName,
    },
    provenanceSources: INITIAL_HEALTH_SOURCES,
    emergencyContacts: INITIAL_EMERGENCY_CONTACTS,
    currentMedications: SYNTHETIC_MEDICATION_SCHEDULE,
    upcomingAppointment: SYNTHETIC_NEXT_APPOINTMENT,
    careCircleMembers: SYNTHETIC_CARE_CIRCLE,
    moduleStatus: {
      continuityEngine: "Phase 9 — Pending verification diffs previewed",
      careGapRadar: "Phase 10 — Initial scans operational",
      carePassport: "Phase 13 — Ready for authorized export",
    },
  });
}
