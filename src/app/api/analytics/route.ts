import { NextResponse } from "next/server";
import { getCareAnalytics } from "@/lib/data/timeline-analytics-data";
import { analyticsQuerySchema } from "@/lib/validations/timeline-passport.schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = analyticsQuerySchema.safeParse({
    range: searchParams.get("range") || "30d",
    patientId: searchParams.get("patientId") || "patient-profile-001",
  });

  const range = parseResult.success ? parseResult.data.range : "30d";
  const patientId = parseResult.success ? (parseResult.data.patientId || "patient-profile-001") : "patient-profile-001";

  const analytics = getCareAnalytics(patientId, range);

  return NextResponse.json({
    success: true,
    analytics,
  });
}
