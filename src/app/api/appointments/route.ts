import { NextResponse } from "next/server";
import { createAppointmentSchema } from "@/lib/validations/appointment.schema";
import { 
  getCachedAppointments, 
  addAppointment 
} from "@/lib/data/appointment-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { AppointmentRecord } from "@/types/caretrace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "all";
  const appointments = getCachedAppointments();

  const now = new Date();

  let filtered = [...appointments];
  if (statusFilter === "upcoming") {
    filtered = filtered.filter(
      (a) => (a.appointmentStatus === "confirmed" || a.appointmentStatus === "planned" || a.appointmentStatus === "awaiting_confirmation") &&
             new Date(a.appointmentDatetime || a.appointmentDate || "") >= now
    );
  } else if (statusFilter === "history" || statusFilter === "past") {
    filtered = filtered.filter(
      (a) => a.appointmentStatus === "completed" || 
             a.appointmentStatus === "cancelled" || 
             new Date(a.appointmentDatetime || a.appointmentDate || "") < now
    );
  }

  // Sort upcoming chronologically ascending, history descending
  if (statusFilter === "upcoming") {
    filtered.sort((a, b) => 
      new Date(a.appointmentDatetime || a.appointmentDate || "").getTime() - 
      new Date(b.appointmentDatetime || b.appointmentDate || "").getTime()
    );
  } else {
    filtered.sort((a, b) => 
      new Date(b.appointmentDatetime || b.appointmentDate || "").getTime() - 
      new Date(a.appointmentDatetime || a.appointmentDate || "").getTime()
    );
  }

  return NextResponse.json({
    success: true,
    appointments: filtered,
    total: filtered.length,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = createAppointmentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const datetimeStr = `${data.appointmentDate}T${data.appointmentTime}:00`;

    // Duplicate check: Same provider, same patient, same datetime
    const existing = getCachedAppointments().find(
      (a) => a.providerName.toLowerCase() === data.providerName.toLowerCase() &&
             a.appointmentDatetime?.startsWith(data.appointmentDate) &&
             a.appointmentStatus !== "cancelled"
    );

    if (existing) {
      return NextResponse.json(
        {
          error: "An appointment with this provider on the selected date already exists. Please verify to avoid duplicates.",
        },
        { status: 409 }
      );
    }

    const newAppointment: AppointmentRecord = {
      id: `appt-${Date.now()}`,
      patientId: data.patientId,
      title: data.title,
      appointmentType: data.appointmentType,
      providerName: data.providerName,
      clinicName: data.clinicName,
      departmentOrSpecialty: data.departmentOrSpecialty || undefined,
      locationText: data.locationText || undefined,
      appointmentDatetime: datetimeStr,
      timezone: data.timezone,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      appointmentStatus: "confirmed",
      bookingReference: data.bookingReference || undefined,
      contactInformation: data.contactInformation || undefined,
      preparationNotes: data.preparationNotes || undefined,
      assignedAccompanyingName: data.assignedAccompanyingName || undefined,
      assignedAccompanyingRole: data.assignedAccompanyingRole || undefined,
      transportationNeeded: data.transportationNeeded,
      createdBy: userPerspective.sampleName,
      updatedBy: userPerspective.sampleName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Compatibility aliases
      facility: data.clinicName,
      specialty: data.departmentOrSpecialty || "General",
      locationAddress: data.locationText,
      appointmentDate: datetimeStr,
      durationMinutes: data.estimatedDurationMinutes,
      transportNeeded: data.transportationNeeded,
      companionName: data.assignedAccompanyingName,
      status: "confirmed",
    };

    addAppointment(newAppointment);

    return NextResponse.json(
      {
        success: true,
        appointment: newAppointment,
        message: "Clinical appointment successfully registered and shared with Care Circle.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error processing appointment creation." },
      { status: 500 }
    );
  }
}
