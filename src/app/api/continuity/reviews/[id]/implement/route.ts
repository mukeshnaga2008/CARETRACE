import { NextResponse } from "next/server";
import { executeImplementationSchema } from "@/lib/validations/continuity.schema";
import { executeControlledImplementation } from "@/lib/data/care-continuity-data";
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

  try {
    const body = await request.json();
    const parseResult = executeImplementationSchema.safeParse({
      ...body,
      reviewId: id,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid implementation parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { optimisticVersionLock } = parseResult.data;

    const result = executeControlledImplementation(
      id,
      userPerspective.sampleName,
      optimisticVersionLock
    );

    if (!result.success) {
      const isConflict =
        result.error?.includes("lock mismatch") ||
        result.error?.includes("Stale version");
      return NextResponse.json(
        { error: result.error || "Implementation failed" },
        { status: isConflict ? 409 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      job: result.job,
      message: "Controlled downstream implementation executed successfully. Clinical records synchronized safely.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error executing downstream implementation", details: String(error) },
      { status: 500 }
    );
  }
}
