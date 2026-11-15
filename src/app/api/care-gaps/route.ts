import { NextResponse } from "next/server";
import { createCareGapSchema } from "@/lib/validations/care-gaps.schema";
import { getCachedCareGaps } from "@/lib/data/care-gap-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { CareGapRecord } from "@/types/caretrace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const status = searchParams.get("status");
  const assignedTo = searchParams.get("assignedTo");

  let gaps = getCachedCareGaps();

  if (category && category !== "all") {
    gaps = gaps.filter((g) => g.category === category);
  }

  if (priority && priority !== "all") {
    gaps = gaps.filter((g) => g.priority === priority);
  }

  if (status && status !== "all") {
    gaps = gaps.filter((g) => g.status === status);
  }

  if (assignedTo && assignedTo !== "all") {
    gaps = gaps.filter((g) => g.assignedToId === assignedTo || g.assignedToName === assignedTo);
  }

  return NextResponse.json({
    success: true,
    total: gaps.length,
    gaps,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "caregiver";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.caregiver;

  try {
    const body = await request.json();
    const parseResult = createCareGapSchema.safeParse(body);

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
    const now = new Date().toISOString();

    const newGap: CareGapRecord = {
      ...data,
      id: `gap-${Date.now()}`,
      status: "open",
      detectedAt: now,
      deduplicationKey: `${data.patientId}_${data.gapType}_${data.relatedRecordType}_${data.relatedRecordId}`,
      auditHistory: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          actorName: userPerspective.sampleName,
          actorRole: userPerspective.label,
          action: "gap_manually_recorded",
          note: data.explanation,
          newStatus: "open",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const gaps = getCachedCareGaps();
    gaps.unshift(newGap);

    return NextResponse.json({
      success: true,
      gap: newGap,
      message: "Care gap recorded and queued for care coordination.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error creating care gap", details: String(error) },
      { status: 500 }
    );
  }
}
