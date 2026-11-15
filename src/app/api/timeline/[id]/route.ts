import { NextResponse } from "next/server";
import { getTimelineEventById } from "@/lib/data/timeline-analytics-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = getTimelineEventById(id);

  if (!event) {
    return NextResponse.json({ error: "Timeline event not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    event,
  });
}
