import { NextResponse } from "next/server";
import { getCachedPassportExports } from "@/lib/data/timeline-analytics-data";

export async function GET() {
  const exports = getCachedPassportExports();

  return NextResponse.json({
    success: true,
    total: exports.length,
    exports,
  });
}
