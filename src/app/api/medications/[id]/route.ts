import { NextResponse } from "next/server";
import { editMedicationSchema } from "@/lib/validations/medication.schema";
import { 
  getCachedMedications, 
  getCachedVersions, 
  updateMedication 
} from "@/lib/data/medication-lifecycle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const medications = getCachedMedications();
  const med = medications.find((m) => m.id === id);

  if (!med) {
    return NextResponse.json({ error: "Medication record not found" }, { status: 404 });
  }

  const versions = getCachedVersions().filter((v) => v.medicationId === id);

  return NextResponse.json({
    success: true,
    medication: med,
    versionHistory: versions,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = editMedicationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { changeReason, status, ...data } = parseResult.data;

    // Check if clinical instructions were modified
    const medications = getCachedMedications();
    const currentMed = medications.find((m) => m.id === id);

    if (!currentMed) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    const instructionChanged = 
      currentMed.prescribedInstructions !== data.prescribedInstructions ||
      currentMed.strengthText !== data.strengthText;

    // If clinical instructions were modified by a non-doctor, mark for verification review
    const newVerificationStatus = instructionChanged && demoRole !== "patient"
      ? "awaiting_review"
      : currentMed.verificationStatus;

    const updated = updateMedication(
      id,
      {
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
        scheduledTimes: data.scheduledTimes,
        daysOfWeek: data.daysOfWeek,
        notes: data.notes || undefined,
        status: instructionChanged && demoRole !== "patient" ? "awaiting_verification" : status,
        verificationStatus: newVerificationStatus,
      },
      changeReason,
      userPerspective.sampleName,
      userPerspective.label
    );

    return NextResponse.json({
      success: true,
      message: instructionChanged && demoRole !== "patient"
        ? "Instructions updated. Marked as 'Awaiting Review' until verified by clinician."
        : "Medication record updated and new version logged.",
      medication: updated,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update medication record." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  const updated = updateMedication(
    id,
    { status: "discontinued", archivedAt: new Date().toISOString() },
    "Prescription discontinued and archived",
    userPerspective.sampleName,
    userPerspective.label
  );

  if (!updated) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Medication discontinued and safely archived.",
    medication: updated,
  });
}
