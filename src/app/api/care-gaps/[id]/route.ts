import { NextResponse } from "next/server";
import { updateCareGapStatusSchema } from "@/lib/validations/care-gaps.schema";
import {
  getCareGapById,
  updateCareGapStatus,
} from "@/lib/data/care-gap-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const gap = getCareGapById(id);

  if (!gap) {
    return NextResponse.json({ error: "Care gap not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    gap,
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
    const parseResult = updateCareGapStatusSchema.safeParse({
      ...body,
      gapId: id,
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

    const { status, note, clarificationRequest } = parseResult.data;

    const updated = updateCareGapStatus(
      id,
      status,
      userPerspective.sampleName,
      userPerspective.label,
      note,
      clarificationRequest
    );

    if (!updated) {
      return NextResponse.json({ error: "Care gap not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      gap: updated,
      message: `Care gap status updated to ${status}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error updating care gap", details: String(error) },
      { status: 500 }
    );
  }
}
