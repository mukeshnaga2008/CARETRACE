import { NextResponse } from "next/server";
import { createContinuityAnalysisSchema } from "@/lib/validations/continuity.schema";
import {
  getCachedAnalyses,
  detectInstructionChange,
} from "@/lib/data/care-continuity-data";
import {
  getCachedInstructions,
  getCachedInstructionVersions,
} from "@/lib/data/instruction-vault-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const eventType = searchParams.get("eventType");

  let analyses = getCachedAnalyses();

  if (status && status !== "all") {
    analyses = analyses.filter((a) => a.status === status);
  }

  if (eventType && eventType !== "all") {
    analyses = analyses.filter((a) => a.eventType === eventType);
  }

  const all = getCachedAnalyses();
  const summary = {
    total: all.length,
    awaitingReview: all.filter((a) => a.status === "awaiting_human_review").length,
    needsClarification: all.filter((a) => a.status === "needs_clarification").length,
    approved: all.filter((a) => a.status === "approved_for_downstream_update").length,
    completed: all.filter((a) => a.status === "implementation_completed").length,
    rejected: all.filter((a) => a.status === "rejected").length,
  };

  return NextResponse.json({
    success: true,
    summary,
    analyses,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "caregiver";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.caregiver;

  try {
    const body = await request.json();
    const parseResult = createContinuityAnalysisSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { instructionId, eventType, previousVersionNumber } = parseResult.data;
    const instruction = getCachedInstructions().find((i) => i.id === instructionId);

    if (!instruction) {
      return NextResponse.json({ error: "Instruction record not found" }, { status: 404 });
    }

    let prevVersion = null;
    if (previousVersionNumber) {
      prevVersion =
        getCachedInstructionVersions().find(
          (v) => v.instructionId === instructionId && v.versionNumber === previousVersionNumber
        ) || null;
    }

    const result = detectInstructionChange(
      instruction,
      prevVersion,
      eventType,
      {
        name: userPerspective.sampleName,
        role: userPerspective.label,
      }
    );

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      impacts: result.impacts,
      review: result.review,
      message: `Continuity analysis completed. Found ${result.impacts.length} potentially affected downstream records.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error performing continuity analysis" },
      { status: 500 }
    );
  }
}
