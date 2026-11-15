import { NextResponse } from "next/server";
import { archiveInstructionSchema } from "@/lib/validations/instruction.schema";
import {
  getCachedInstructions,
  getCachedInstructionVersions,
  getCachedInstructionSources,
  archiveInstruction,
} from "@/lib/data/instruction-vault-data";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const instructions = getCachedInstructions();
  const instruction = instructions.find((i) => i.id === id);

  if (!instruction) {
    return NextResponse.json({ error: "Instruction record not found" }, { status: 404 });
  }

  const versions = getCachedInstructionVersions().filter((v) => v.instructionId === id);
  const source = getCachedInstructionSources().find((s) => s.id === instruction.sourceId);

  return NextResponse.json({
    success: true,
    instruction: {
      ...instruction,
      source: source || instruction.source,
    },
    versions,
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = archiveInstructionSchema.safeParse({
      instructionId: id,
      archiveReason: body.archiveReason || "Archived by authorized care coordinator",
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "A valid reason for archiving (min 5 chars) is mandatory" },
        { status: 400 }
      );
    }

    const archived = archiveInstruction(id, parseResult.data.archiveReason);
    if (!archived) {
      return NextResponse.json({ error: "Instruction not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      instruction: archived,
      message: "Instruction moved to historical archive.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error archiving instruction" },
      { status: 500 }
    );
  }
}
