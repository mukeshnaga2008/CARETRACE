import { NextResponse } from "next/server";
import { emergencyContactSchema } from "@/lib/validations/patient-profile.schema";
import { INITIAL_EMERGENCY_CONTACTS } from "@/lib/data/patient-profile-data";
import { EmergencyContact } from "@/types/caretrace";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

// In-memory contact store for evaluation demo
let cachedContacts: EmergencyContact[] = [...INITIAL_EMERGENCY_CONTACTS];

export async function GET() {
  const sorted = [...cachedContacts].sort((a, b) => a.priorityOrder - b.priorityOrder);
  return NextResponse.json({
    success: true,
    contacts: sorted,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  if (demoRole === "caregiver") {
    return NextResponse.json(
      { error: "Caregivers cannot add emergency contacts. Only the patient or family administrator holds permission." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = emergencyContactSchema.safeParse(body);

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

    // Check if priority order is already taken, shift others down
    const nextPriority = data.priorityOrder;
    cachedContacts.forEach((c) => {
      if (c.priorityOrder >= nextPriority) {
        c.priorityOrder += 1;
      }
    });

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      patientId: "patient-profile-001",
      contactName: data.contactName,
      relationship: data.relationship,
      phoneNumber: data.phoneNumber,
      email: data.email || undefined,
      priorityOrder: nextPriority,
      isAuthorizedCaregiver: data.isAuthorizedCaregiver,
      notes: data.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cachedContacts.push(newContact);
    cachedContacts.sort((a, b) => a.priorityOrder - b.priorityOrder);

    return NextResponse.json({
      success: true,
      message: "Emergency contact successfully added.",
      contact: newContact,
      contacts: cachedContacts,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to add emergency contact." },
      { status: 500 }
    );
  }
}
