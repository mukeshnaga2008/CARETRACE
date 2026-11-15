import { NextResponse } from "next/server";
import { generateDoseEventsForDate } from "@/lib/data/medication-lifecycle-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const events = generateDoseEventsForDate("patient-profile-001", dateParam);

  return NextResponse.json({
    success: true,
    targetDate: dateParam,
    events,
  });
}
