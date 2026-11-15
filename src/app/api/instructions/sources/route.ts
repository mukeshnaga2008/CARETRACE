import { NextResponse } from "next/server";
import { createInstructionSourceSchema } from "@/lib/validations/instruction.schema";
import {
  getCachedInstructionSources,
  addInstructionSource,
} from "@/lib/data/instruction-vault-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { InstructionSource } from "@/types/caretrace";

export async function GET() {
  const sources = getCachedInstructionSources();
  return NextResponse.json({
    success: true,
    sources,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = createInstructionSourceSchema.safeParse(body);

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

    const newSource: InstructionSource = {
      id: `src-${Date.now()}`,
      patientId: data.patientId,
      sourceType: data.sourceType,
      title: data.title,
      facilityName: data.facilityName,
      providerName: data.providerName,
      providerRole: data.providerRole,
      documentReference: data.documentReference,
      encounterDate: data.encounterDate,
      rawNotes: data.rawNotes,
      enteredBy: "member-david",
      enteredByName: userPerspective.sampleName,
      enteredByRole: userPerspective.label,
      entryTimestamp: new Date().toISOString(),
      isMissingSourceDetails: data.isMissingSourceDetails,
      notesAboutMissingSource: data.notesAboutMissingSource,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addInstructionSource(newSource);

    return NextResponse.json({
      success: true,
      source: newSource,
      message: "New source document record established in provenance registry.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error creating source record" },
      { status: 500 }
    );
  }
}
