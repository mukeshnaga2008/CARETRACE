import { NextResponse } from "next/server";
import { excludeImpactRecordSchema } from "@/lib/validations/continuity.schema";
import {
  getCachedImpacts,
  excludeImpactRecord,
} from "@/lib/data/care-continuity-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordType = searchParams.get("type");
  const reviewStatus = searchParams.get("status");

  let impacts = getCachedImpacts();

  if (recordType && recordType !== "all") {
    impacts = impacts.filter((imp) => imp.relatedRecordType === recordType);
  }

  if (reviewStatus && reviewStatus !== "all") {
    impacts = impacts.filter((imp) => imp.reviewStatus === reviewStatus);
  }

  return NextResponse.json({
    success: true,
    total: impacts.length,
    impacts,
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parseResult = excludeImpactRecordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { impactRecordId, exclusionReason } = parseResult.data;
    const updated = excludeImpactRecord(impactRecordId, exclusionReason);

    if (!updated) {
      return NextResponse.json({ error: "Impact record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      impact: updated,
      message: "Impact record excluded from downstream synchronization with recorded rationale.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error excluding record" },
      { status: 500 }
    );
  }
}
