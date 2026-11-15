import { NextResponse } from "next/server";
import { getUnifiedCareTimeline } from "@/lib/data/timeline-analytics-data";
import { timelineFilterSchema } from "@/lib/validations/timeline-passport.schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = timelineFilterSchema.safeParse({
    patientId: searchParams.get("patientId") || undefined,
    category: searchParams.get("category") || undefined,
    sourceModule: searchParams.get("sourceModule") || undefined,
    search: searchParams.get("search") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 40,
  });

  const query = parseResult.success ? parseResult.data : { page: 1, limit: 40 };

  const allEvents = getUnifiedCareTimeline(query.patientId || "patient-profile-001", {
    category: query.category,
    sourceModule: query.sourceModule,
    search: query.search,
    startDate: query.startDate,
    endDate: query.endDate,
  });

  const page = query.page;
  const limit = query.limit;
  const startIndex = (page - 1) * limit;
  const paginatedEvents = allEvents.slice(startIndex, startIndex + limit);

  const categoryCounts = {
    medication: allEvents.filter((e) => e.category === "medication").length,
    appointment: allEvents.filter((e) => e.category === "appointment").length,
    instruction: allEvents.filter((e) => e.category === "instruction").length,
    continuity: allEvents.filter((e) => e.category === "continuity").length,
    care_circle: allEvents.filter((e) => e.category === "care_circle").length,
    task: allEvents.filter((e) => e.category === "task").length,
    care_gap: allEvents.filter((e) => e.category === "care_gap").length,
    security: allEvents.filter((e) => e.category === "security").length,
  };

  return NextResponse.json({
    success: true,
    total: allEvents.length,
    page,
    limit,
    totalPages: Math.ceil(allEvents.length / limit),
    categoryCounts,
    events: paginatedEvents,
  });
}
