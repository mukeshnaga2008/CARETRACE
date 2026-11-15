import { NextResponse } from "next/server";
import { editAppointmentSchema, cancelAppointmentSchema } from "@/lib/validations/appointment.schema";
import { 
  getCachedAppointments, 
  getCachedPreparationItems, 
  getCachedAppointmentNotes, 
  getCachedFollowUpTasks, 
  getCachedAppointmentHistory,
  updateAppointment,
  cancelAppointment
} from "@/lib/data/appointment-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const appointments = getCachedAppointments();
  const appointment = appointments.find((a) => a.id === id);

  if (!appointment) {
    return NextResponse.json({ error: "Appointment record not found" }, { status: 404 });
  }

  const preparationItems = getCachedPreparationItems(id);
  const notes = getCachedAppointmentNotes(id);
  const followUpTasks = getCachedFollowUpTasks(id);
  const history = getCachedAppointmentHistory(id);

  return NextResponse.json({
    success: true,
    appointment,
    preparationItems,
    notes,
    followUpTasks,
    history,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = editAppointmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { changeReason, appointmentDate, appointmentTime, ...rest } = parseResult.data;

    let datetimeUpdate: string | undefined = undefined;
    if (appointmentDate && appointmentTime) {
      datetimeUpdate = `${appointmentDate}T${appointmentTime}:00`;
    }

    const updated = updateAppointment(
      id,
      {
        ...rest,
        ...(datetimeUpdate ? { appointmentDatetime: datetimeUpdate, appointmentDate: datetimeUpdate } : {}),
      },
      changeReason,
      userPerspective.sampleName,
      userPerspective.label
    );

    if (!updated) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      appointment: updated,
      message: "Appointment record successfully updated and logged in history.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error updating appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = cancelAppointmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "A cancellation reason of at least 5 characters is mandatory",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const cancelled = cancelAppointment(
      id,
      parseResult.data.cancellationReason,
      userPerspective.sampleName,
      userPerspective.label
    );

    if (!cancelled) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      appointment: cancelled,
      message: "Appointment successfully cancelled and logged in audit history.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error cancelling appointment" },
      { status: 500 }
    );
  }
}
