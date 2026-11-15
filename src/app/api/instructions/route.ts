import { NextResponse } from "next/server";
import { createInstructionSchema } from "@/lib/validations/instruction.schema";
import {
  getCachedInstructions,
  getCachedInstructionSources,
  addCareInstruction,
} from "@/lib/data/instruction-vault-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { CareInstruction } from "@/types/caretrace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let instructions = getCachedInstructions();

  if (status && status !== "all") {
    instructions = instructions.filter((i) => i.verificationStatus === status);
  }

  if (category && category !== "all") {
    instructions = instructions.filter((i) => i.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    instructions = instructions.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.tags && i.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  const all = getCachedInstructions();
  const summary = {
    total: all.length,
    active: all.filter((i) => i.verificationStatus !== "archived" && i.verificationStatus !== "superseded").length,
    verified: all.filter((i) => i.verificationStatus === "verified").length,
    awaitingReview: all.filter((i) => i.verificationStatus === "awaiting_verification").length,
    superseded: all.filter((i) => i.verificationStatus === "superseded").length,
    archived: all.filter((i) => i.verificationStatus === "archived").length,
  };

  return NextResponse.json({
    success: true,
    summary,
    instructions,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = createInstructionSchema.safeParse(body);

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
    const source = getCachedInstructionSources().find((s) => s.id === data.sourceId);

    const newInstruction: CareInstruction = {
      id: `inst-${Date.now()}`,
      patientId: data.patientId,
      title: data.title,
      category: data.category,
      description: data.description,
      structuredContent: data.structuredContent,
      currentVersionNumber: 1,
      verificationStatus: data.submitForReview ? "awaiting_verification" : "draft",
      sourceId: data.sourceId,
      source,
      effectiveDate: data.effectiveDate,
      expirationDate: data.expirationDate,
      tags: data.tags || [],
      relatedMedicationId: data.relatedMedicationId,
      relatedAppointmentId: data.relatedAppointmentId,
      relatedTaskId: data.relatedTaskId,
      createdBy: "member-david",
      createdByName: userPerspective.sampleName,
      createdByRole: userPerspective.label,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCareInstruction(newInstruction);

    return NextResponse.json({
      success: true,
      instruction: newInstruction,
      message: "Instruction successfully archived in vault and queued for clinical review.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error creating instruction" },
      { status: 500 }
    );
  }
}
