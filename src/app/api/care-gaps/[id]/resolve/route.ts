import { NextResponse } from "next/server";
import {
  resolveCareGapSchema,
  dismissCareGapSchema,
} from "@/lib/validations/care-gaps.schema";
import {
  resolveCareGap,
  dismissCareGap,
  getCareGapById,
} from "@/lib/data/care-gap-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "caregiver";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.caregiver;

  const gap = getCareGapById(id);
  if (!gap) {
    return NextResponse.json({ error: "Care gap not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Check if dismissing
    if (body.action === "dismiss") {
      const parseResult = dismissCareGapSchema.safeParse({
        gapId: id,
        dismissedReason: body.dismissedReason,
        dismissedByName: userPerspective.sampleName,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          {
            error: "A documented dismissal reason of at least 5 characters is mandatory",
            details: parseResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const updated = dismissCareGap(
        id,
        parseResult.data.dismissedReason,
        userPerspective.sampleName,
        userPerspective.label
      );

      return NextResponse.json({
        success: true,
        gap: updated,
        message: "Care gap dismissed with recorded justification.",
      });
    }

    // Default: resolve gap
    const parseResult = resolveCareGapSchema.safeParse({
      gapId: id,
      resolutionAction: body.resolutionAction,
      resolutionDetails: body.resolutionDetails,
      resolvedByName: userPerspective.sampleName,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Documented resolution action and details are mandatory",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { resolutionAction, resolutionDetails } = parseResult.data;

    const updated = resolveCareGap(
      id,
      resolutionAction,
      resolutionDetails,
      userPerspective.sampleName,
      userPerspective.label
    );

    return NextResponse.json({
      success: true,
      gap: updated,
      message: "Care gap successfully resolved with auditable resolution record.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error resolving care gap", details: String(error) },
      { status: 500 }
    );
  }
}
