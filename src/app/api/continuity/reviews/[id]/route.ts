import { NextResponse } from "next/server";
import {
  continuityReviewDecisionSchema,
  requestContinuityClarificationSchema,
  escalateReviewSchema,
} from "@/lib/validations/continuity.schema";
import {
  getCachedContinuityReviews,
  getCachedImpacts,
  getCachedAnalyses,
  submitReviewDecision,
  requestReviewClarification,
  escalateContinuityReview,
} from "@/lib/data/care-continuity-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const reviews = getCachedContinuityReviews();
  const review = reviews.find((r) => r.id === id);

  if (!review) {
    return NextResponse.json({ error: "Continuity review not found" }, { status: 404 });
  }

  const analysis = getCachedAnalyses().find((a) => a.id === review.analysisId);
  const impacts = getCachedImpacts().filter((imp) => imp.analysisId === review.analysisId);

  return NextResponse.json({
    success: true,
    review,
    analysis,
    impacts,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "caregiver";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.caregiver;

  try {
    const body = await request.json();

    // Check if requesting clarification
    if (body.action === "clarification") {
      const parseResult = requestContinuityClarificationSchema.safeParse({
        reviewId: id,
        question: body.question,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          { error: "A valid clarification question (min 5 chars) is mandatory" },
          { status: 400 }
        );
      }

      const updated = requestReviewClarification(id, parseResult.data.question, userPerspective.sampleName);
      if (!updated) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        review: updated,
        message: "Clarification request submitted to authoring caregiver.",
      });
    }

    // Check if escalating
    if (body.action === "escalate") {
      const parseResult = escalateReviewSchema.safeParse({
        reviewId: id,
        escalateTo: body.escalateTo,
        escalationReason: body.escalationReason,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Target reviewer and documented escalation reason required" },
          { status: 400 }
        );
      }

      const updated = escalateContinuityReview(
        id,
        parseResult.data.escalateTo,
        parseResult.data.escalationReason
      );

      return NextResponse.json({
        success: true,
        review: updated,
        message: `Review successfully escalated to ${parseResult.data.escalateTo}.`,
      });
    }

    // Default: submit review decision (approved/rejected/needs_clarification)
    const parseResult = continuityReviewDecisionSchema.safeParse({
      ...body,
      reviewId: id,
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

    const { decision, rationale, approvedRecordIds, excludedRecords, optimisticVersionLock } = parseResult.data;

    const result = submitReviewDecision(
      id,
      decision,
      rationale,
      approvedRecordIds,
      excludedRecords,
      {
        name: userPerspective.sampleName,
        role: userPerspective.label,
      },
      optimisticVersionLock
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      review: result.review,
      message: `Review marked as ${decision.toUpperCase()}. Documented in continuity audit ledger.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error submitting review decision" },
      { status: 500 }
    );
  }
}
