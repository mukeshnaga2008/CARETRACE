import { NextResponse } from "next/server";
import {
  getCarePassportData,
  getCarePassportPreferences,
} from "@/lib/data/timeline-analytics-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") || "patient-profile-001";

  const config = getCarePassportPreferences();
  const data = getCarePassportData(patientId, config);

  return NextResponse.json({
    success: true,
    data,
  });
}
