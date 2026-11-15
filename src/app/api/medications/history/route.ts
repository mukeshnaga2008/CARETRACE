import { NextResponse } from "next/server";
import { 
  getCachedMedications, 
  getCachedVersions, 
  getCachedDoseEvents 
} from "@/lib/data/medication-lifecycle-data";

export async function GET() {
  const versions = getCachedVersions();
  const medications = getCachedMedications();
  const doseEvents = getCachedDoseEvents().filter((e) => e.reportedAt);

  return NextResponse.json({
    success: true,
    versionHistory: versions,
    adherenceAuditTrail: doseEvents,
    medicationRoster: medications,
  });
}
