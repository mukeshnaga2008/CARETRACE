import { NextResponse } from "next/server";
import { reviewMedicationSchema } from "@/lib/validations/medication.schema";
import { 
  getCachedMedications, 
  verifyMedicationRecord 
} from "@/lib/data/medication-lifecycle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET() {
  const allMeds = getCachedMedications();
  const reviewRequired = allMeds.filter(
    (m) => m.verificationStatus === "awaiting_review" || m.verificationStatus === "needs_clarification"
  );

  return NextResponse.json({
    success: true,
    reviewRequired,
    count: reviewRequired.length,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = reviewMedicationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { medicationId, decision, clarificationNotes } = parseResult.data;

    const updated = verifyMedicationRecord(
      medicationId,
      decision,
      userPerspective.sampleName,
      userPerspective.label,
      clarificationNotes
    );

    if (!updated) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: decision === "verified"
        ? `Prescription clinical instructions successfully verified by ${userPerspective.sampleName}.`
        : `Clarification request logged for prescription. Marked as 'Needs Clarification'.`,
      medication: updated,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process medication verification." },
      { status: 500 }
    );
  }
}
