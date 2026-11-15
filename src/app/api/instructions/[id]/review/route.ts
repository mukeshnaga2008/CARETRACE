import { NextResponse } from "next/server";
import { reviewInstructionSchema } from "@/lib/validations/instruction.schema";
import { reviewInstruction } from "@/lib/data/instruction-vault-data";
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

  try {
    const body = await request.json();
    const parseResult = reviewInstructionSchema.safeParse({
      ...body,
      instructionId: id,
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

    const { decision, rationale, checklistNotes } = parseResult.data;

    const updated = reviewInstruction(
      id,
      decision,
      rationale,
      {
        id: "member-vance",
        name: userPerspective.sampleName,
        role: userPerspective.label,
      },
      checklistNotes
    );

    if (!updated) {
      return NextResponse.json({ error: "Instruction not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      instruction: updated,
      message: `Instruction marked as ${decision}. Human review decision logged in audit trail.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error during instruction review" },
      { status: 500 }
    );
  }
}
