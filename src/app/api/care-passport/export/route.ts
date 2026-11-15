import { NextResponse } from "next/server";
import {
  recordPassportExport,
  getCarePassportData,
  getCarePassportPreferences,
} from "@/lib/data/timeline-analytics-data";
import { createPassportExportSchema } from "@/lib/validations/timeline-passport.schema";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.family;

  // Rate limit: max 15 passport exports per minute per role session
  const rateLimit = checkRateLimit(`passport_export_${demoRole}`, 15, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many passport export requests. Please wait a moment before re-exporting.",
        retryAfterSeconds: rateLimit.resetSeconds,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = createPassportExportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { patientId, includedSections, reason } = parseResult.data;
    const config = getCarePassportPreferences();
    const passportData = getCarePassportData(patientId, config);

    // Record non-repudiable audit export
    const exportRecord = recordPassportExport(
      patientId,
      demoRole,
      userPerspective.sampleName,
      userPerspective.label,
      includedSections,
      passportData.meta.verificationHash,
      reason
    );

    return NextResponse.json({
      success: true,
      exportRecord,
      passportData,
      message: `Care Passport PDF snapshot successfully generated with verification hash: ${exportRecord.verificationHash}. Logged to audit ledger.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error generating Care Passport export", details: String(error) },
      { status: 500 }
    );
  }
}
