import { NextResponse } from "next/server";
import {
  assignCareGapSchema,
  respondToAssignmentSchema,
} from "@/lib/validations/care-gaps.schema";
import {
  assignCareGap,
  respondToAssignment,
  getCareGapById,
} from "@/lib/data/care-gap-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "caregiver";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.caregiver;

  const gap = getCareGapById(id);
  if (!gap) {
    return NextResponse.json({ error: "Care gap not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Check if responding to assignment (accept or decline)
    if (body.action === "accept" || body.action === "decline") {
      const parseResult = respondToAssignmentSchema.safeParse({
        gapId: id,
        action: body.action,
        reason: body.reason,
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

      const updated = respondToAssignment(
        id,
        parseResult.data.action,
        userPerspective.sampleName,
        userPerspective.label,
        parseResult.data.reason
      );

      return NextResponse.json({
        success: true,
        gap: updated,
        message:
          parseResult.data.action === "accept"
            ? "Assignment accepted. Responsibility acknowledged."
            : "Assignment declined. Returned to unassigned queue.",
      });
    }

    // Default: assign/reassign to a member
    const parseResult = assignCareGapSchema.safeParse({
      ...body,
      gapId: id,
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

    const { assignedToId, assignedToName, assignedToRole, note } = parseResult.data;

    const updated = assignCareGap(
      id,
      assignedToId,
      assignedToName,
      assignedToRole,
      userPerspective.sampleName,
      userPerspective.label,
      note
    );

    return NextResponse.json({
      success: true,
      gap: updated,
      message: `Care gap successfully assigned to ${assignedToName} (${assignedToRole}).`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error during gap assignment", details: String(error) },
      { status: 500 }
    );
  }
}
