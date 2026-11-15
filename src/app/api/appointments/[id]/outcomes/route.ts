import { NextResponse } from "next/server";
import { recordVisitOutcomeSchema } from "@/lib/validations/appointment.schema";
import { 
  getCachedAppointmentNotes, 
  recordVisitOutcome 
} from "@/lib/data/appointment-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { AppointmentNote } from "@/types/caretrace";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const notes = getCachedAppointmentNotes(id);

  return NextResponse.json({
    success: true,
    notes,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "caregiver";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = recordVisitOutcomeSchema.safeParse({
      ...body,
      appointmentId: id,
    });

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

    const newNote: AppointmentNote = {
      id: `note-${Date.now()}`,
      appointmentId: id,
      patientId: "patient-profile-001",
      visitDate: new Date().toISOString().split("T")[0],
      providerName: body.providerName || "Attending Healthcare Provider",
      summaryText: data.summaryText,
      authorName: userPerspective.sampleName,
      authorRole: userPerspective.label,
      sourceProvenance: data.sourceProvenance,
      verificationStatus: data.verificationStatus,
      followUpInstructions: data.followUpInstructions || undefined,
      documentsReference: data.documentsReference || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedAppt = recordVisitOutcome(newNote);

    return NextResponse.json(
      {
        success: true,
        note: newNote,
        appointment: updatedAppt,
        message: "Visit outcome successfully recorded and appointment transitioned to Completed.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error saving visit outcome" },
      { status: 500 }
    );
  }
}
