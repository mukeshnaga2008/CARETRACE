import { NextResponse } from "next/server";
import {
  getCachedAnalyses,
  getCachedImpacts,
  getCachedContinuityReviews,
} from "@/lib/data/care-continuity-data";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const analyses = getCachedAnalyses();
  const analysis = analyses.find((a) => a.id === id);

  if (!analysis) {
    return NextResponse.json({ error: "Continuity analysis record not found" }, { status: 404 });
  }

  const impacts = getCachedImpacts().filter((imp) => imp.analysisId === id);
  const review = getCachedContinuityReviews().find((r) => r.analysisId === id);

  return NextResponse.json({
    success: true,
    analysis,
    impacts,
    review,
  });
}
