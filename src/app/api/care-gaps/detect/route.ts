import { NextResponse } from "next/server";
import { detectCareGaps } from "@/lib/data/care-gap-intelligence-data";

export async function POST(request: Request) {
  try {
    let patientId = "patient-profile-001";
    try {
      const body = await request.json();
      if (body?.patientId) {
        patientId = body.patientId;
      }
    } catch {
      // Body may be empty on direct POST
    }

    const result = detectCareGaps(patientId);

    return NextResponse.json({
      success: true,
      message: `Deterministic scan completed. ${result.newGapsCount} new gap(s) identified, ${result.updatedGapsCount} active gap(s) verified.`,
      allGaps: result.allGaps,
      newGapsCount: result.newGapsCount,
      updatedGapsCount: result.updatedGapsCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error running gap detection scan", details: String(error) },
      { status: 500 }
    );
  }
}
