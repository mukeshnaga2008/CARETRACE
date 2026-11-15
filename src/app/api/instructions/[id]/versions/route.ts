import { NextResponse } from "next/server";
import { createInstructionVersionSchema } from "@/lib/validations/instruction.schema";
import {
  getCachedInstructionVersions,
  createNewInstructionVersion,
} from "@/lib/data/instruction-vault-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const versions = getCachedInstructionVersions()
    .filter((v) => v.instructionId === id)
    .sort((a, b) => b.versionNumber - a.versionNumber);

  return NextResponse.json({
    success: true,
    instructionId: id,
    versions,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = createInstructionVersionSchema.safeParse({
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

    const data = parseResult.data;

    const updated = createNewInstructionVersion(
      id,
      {
        title: data.title,
        category: data.category,
        description: data.description,
        sourceId: data.sourceId,
        changeReason: data.changeReason,
        effectiveDate: data.effectiveDate,
        expirationDate: data.expirationDate,
        tags: data.tags,
        structuredContent: data.structuredContent,
        relatedMedicationId: data.relatedMedicationId,
        relatedAppointmentId: data.relatedAppointmentId,
        relatedTaskId: data.relatedTaskId,
      },
      {
        id: "member-david",
        name: userPerspective.sampleName,
        role: userPerspective.label,
      }
    );

    if (!updated) {
      return NextResponse.json({ error: "Instruction not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      instruction: updated,
      message: `Version ${updated.currentVersionNumber} successfully created. Status reset to awaiting verification.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error creating new version" },
      { status: 500 }
    );
  }
}
