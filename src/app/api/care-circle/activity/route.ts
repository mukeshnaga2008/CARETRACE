import { NextResponse } from "next/server";
import { getCachedActivities } from "@/lib/data/care-circle-data";

export async function GET() {
  const activities = getCachedActivities();
  return NextResponse.json({
    success: true,
    activities,
    total: activities.length,
  });
}
