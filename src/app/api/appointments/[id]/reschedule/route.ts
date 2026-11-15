import { NextResponse } from "next/server";
import { rescheduleAppointmentSchema } from "@/lib/validations/appointment.schema";
import { rescheduleAppointment } from "@/lib/data/appointment-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = rescheduleAppointmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { newDate, newTime, rescheduleReason } = parseResult.data;

    const rescheduled = rescheduleAppointment(
      id,
      newDate,
      newTime,
      rescheduleReason,
      userPerspective.sampleName,
      userPerspective.label
    );

    if (!rescheduled) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      appointment: rescheduled,
      message: `Appointment successfully rescheduled to ${newDate} at ${newTime}. Notification events queued.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error rescheduling appointment" },
      { status: 500 }
    );
  }
}
