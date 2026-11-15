import { NextResponse } from "next/server";
import {
  getCarePassportPreferences,
  updateCarePassportPreferences,
} from "@/lib/data/timeline-analytics-data";
import { carePassportConfigSchema } from "@/lib/validations/timeline-passport.schema";

export async function GET() {
  const config = getCarePassportPreferences();

  return NextResponse.json({
    success: true,
    config,
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parseResult = carePassportConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = updateCarePassportPreferences(parseResult.data as any);

    return NextResponse.json({
      success: true,
      config: updated,
      message: "Care Passport section configuration updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error updating passport settings", details: String(error) },
      { status: 500 }
    );
  }
}
