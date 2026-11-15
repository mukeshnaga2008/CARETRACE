import { NextResponse } from "next/server";
import { createMedicationSchema } from "@/lib/validations/medication.schema";
import { 
  getCachedMedications, 
  addMedication 
} from "@/lib/data/medication-lifecycle-data";
import { MedicationRecord } from "@/types/caretrace";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let meds = getCachedMedications();
  if (statusFilter) {
    meds = meds.filter((m) => m.status === statusFilter);
  }

  return NextResponse.json({
    success: true,
    medications: meds,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  try {
    const body = await request.json();
    const parseResult = createMedicationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Determine verification status based on entry provenance
    // Clinical Rule: Family or caregiver entries enter as awaiting_review; never automatically verified!
    const isClinicianEntry = data.sourceType === "physician_prescribed";
    const verificationStatus = isClinicianEntry ? "verified" : "awaiting_review";
    const initialStatus = isClinicianEntry ? "active" : "awaiting_verification";

    const newMed: MedicationRecord = {
      id: `med-${Date.now()}`,
      patientId: "patient-profile-001",
      displayName: data.displayName,
      genericName: data.genericName || undefined,
      strengthText: data.strengthText,
      form: data.form,
      routeText: data.routeText,
      prescribedInstructions: data.prescribedInstructions,
      prescribingProvider: data.prescribingProvider || undefined,
      pharmacy: data.pharmacy || undefined,
      rxNumber: data.rxNumber || undefined,
      refillsRemaining: data.refillsRemaining,
      refillDueDate: data.refillDueDate || undefined,
      effectiveStartDate: data.effectiveStartDate,
      effectiveEndDate: data.effectiveEndDate || undefined,
      sourceType: data.sourceType,
      verificationStatus,
      verifiedAt: isClinicianEntry ? new Date().toISOString() : undefined,
      verifiedByName: isClinicianEntry ? (data.prescribingProvider || "Verified Clinician") : undefined,
      status: initialStatus,
      scheduledTimes: data.scheduledTimes,
      daysOfWeek: data.daysOfWeek,
      notes: data.notes || undefined,
      assignedMemberName: data.assignedMemberName || (demoRole === "family" ? "David Sullivan" : "Margaret Sullivan"),
      assignedMemberRole: demoRole === "family" ? "Family Care Coordinator" : "Patient",
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addMedication(newMed);

    return NextResponse.json({
      success: true,
      message: isClinicianEntry 
        ? "Medication added and activated." 
        : "Medication recorded and queued for clinical verification. (Unverified until reviewed by doctor).",
      medication: newMed,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create medication record." },
      { status: 500 }
    );
  }
}
