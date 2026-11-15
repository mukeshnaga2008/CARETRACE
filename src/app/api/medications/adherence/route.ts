import { NextResponse } from "next/server";
import { recordAdherenceSchema } from "@/lib/validations/medication.schema";
import { 
  getCachedDoseEvents, 
  recordDoseAdherence, 
  calculateAdherenceMetrics 
} from "@/lib/data/medication-lifecycle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET() {
  const events = getCachedDoseEvents();
  const metrics = calculateAdherenceMetrics(events);

  return NextResponse.json({
    success: true,
    metrics,
    recentEvents: events.slice(-20),
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = recordAdherenceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { doseEventId, action, notes, reasonCode } = parseResult.data;

    const result = recordDoseAdherence(
      doseEventId,
      action,
      userPerspective.sampleName,
      userPerspective.label,
      notes,
      reasonCode
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const allEvents = getCachedDoseEvents();
    const metrics = calculateAdherenceMetrics(allEvents);

    return NextResponse.json({
      success: true,
      message: `Dose status updated to '${action.replace('_', ' ')}' by ${userPerspective.sampleName}.`,
      event: result.event,
      metrics,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to record adherence action." },
      { status: 500 }
    );
  }
}
