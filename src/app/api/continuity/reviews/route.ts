import { NextResponse } from "next/server";
import { getCachedContinuityReviews } from "@/lib/data/care-continuity-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let reviews = getCachedContinuityReviews();

  if (status && status !== "all") {
    reviews = reviews.filter((r) => r.reviewStatus === status);
  }

  const all = getCachedContinuityReviews();
  const summary = {
    total: all.length,
    pending: all.filter((r) => r.reviewStatus === "awaiting_human_review").length,
    needsClarification: all.filter((r) => r.reviewStatus === "needs_clarification").length,
    approvedAwaitingImplementation: all.filter((r) => r.reviewStatus === "approved_for_downstream_update").length,
    completed: all.filter((r) => r.reviewStatus === "implementation_completed").length,
    rejected: all.filter((r) => r.reviewStatus === "rejected").length,
  };

  return NextResponse.json({
    success: true,
    summary,
    reviews,
  });
}
