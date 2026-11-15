import { NextResponse } from "next/server";
import { 
  createHandoverSchema, 
  acknowledgeHandoverSchema, 
  clarificationHandoverSchema 
} from "@/lib/validations/care-circle.schema";
import { 
  getCachedHandovers, 
  addHandover, 
  acknowledgeHandover, 
  requestHandoverClarification 
} from "@/lib/data/care-circle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { CareHandover } from "@/types/caretrace";

export async function GET() {
  const handovers = getCachedHandovers();
  // Sort by date descending
  handovers.sort((a, b) => new Date(b.handoverDatetime).getTime() - new Date(a.handoverDatetime).getTime());

  return NextResponse.json({
    success: true,
    handovers,
    total: handovers.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = createHandoverSchema.safeParse(body);

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

    const newHandover: CareHandover = {
      id: `handover-${Date.now()}`,
      patientId: data.patientId,
      outgoingMemberName: data.outgoingMemberName,
      outgoingMemberRole: data.outgoingMemberRole,
      incomingMemberName: data.incomingMemberName,
      incomingMemberRole: data.incomingMemberRole,
      handoverDatetime: data.handoverDatetime,
      timezone: data.timezone,
      relevantResponsibilities: data.relevantResponsibilities,
      pendingTaskIds: data.pendingTaskIds,
      nonClinicalNotes: data.nonClinicalNotes,
      handoverStatus: "ready_for_handover",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addHandover(newHandover);

    return NextResponse.json(
      {
        success: true,
        handover: newHandover,
        message: "Care shift handover created and awaiting incoming member acknowledgement.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error creating handover" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();

    if (body.action === "clarification") {
      const parseResult = clarificationHandoverSchema.safeParse({
        handoverId: body.handoverId,
        clarificationQuestion: body.clarificationQuestion,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          { error: "A clarification question of at least 5 characters is required" },
          { status: 400 }
        );
      }

      const questionText = parseResult.data.clarificationQuestion || parseResult.data.question || "";
      const updated = requestHandoverClarification(
        parseResult.data.handoverId,
        questionText,
        userPerspective.sampleName
      );

      return NextResponse.json({
        success: true,
        handover: updated,
        message: "Clarification request dispatched to outgoing caregiver.",
      });
    }

    // Acknowledge handover
    const parseResult = acknowledgeHandoverSchema.safeParse({
      handoverId: body.handoverId,
      acknowledgementNotes: body.acknowledgementNotes,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Handover ID is required" },
        { status: 400 }
      );
    }

    const updated = acknowledgeHandover(
      parseResult.data.handoverId,
      userPerspective.sampleName,
      parseResult.data.acknowledgementNotes
    );

    return NextResponse.json({
      success: true,
      handover: updated,
      message: "Care shift handover acknowledged. Active responsibilities assumed.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error acknowledging handover" },
      { status: 500 }
    );
  }
}
