import { NextResponse } from "next/server";
import { emergencyContactSchema } from "@/lib/validations/patient-profile.schema";
import { INITIAL_EMERGENCY_CONTACTS } from "@/lib/data/patient-profile-data";
import { EmergencyContact } from "@/types/caretrace";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

let cachedContacts: EmergencyContact[] = [...INITIAL_EMERGENCY_CONTACTS];

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  if (demoRole === "caregiver") {
    return NextResponse.json(
      { error: "Caregivers cannot edit emergency contacts." },
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
    const index = cachedContacts.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    cachedContacts[index] = {
      ...cachedContacts[index],
      contactName: data.contactName,
      relationship: data.relationship,
      phoneNumber: data.phoneNumber,
      email: data.email || undefined,
      priorityOrder: data.priorityOrder,
      isAuthorizedCaregiver: data.isAuthorizedCaregiver,
      notes: data.notes || undefined,
      updatedAt: new Date().toISOString(),
    };

    cachedContacts.sort((a, b) => a.priorityOrder - b.priorityOrder);

    return NextResponse.json({
      success: true,
      message: "Emergency contact updated.",
      contact: cachedContacts[index],
      contacts: cachedContacts,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update emergency contact." },
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
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  if (demoRole === "caregiver") {
    return NextResponse.json(
      { error: "Caregivers cannot remove emergency contacts." },
      { status: 403 }
    );
  }

  const index = cachedContacts.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const removed = cachedContacts.splice(index, 1)[0];

  // Re-normalize priority orders
  cachedContacts.forEach((c, idx) => {
    c.priorityOrder = idx + 1;
  });

  return NextResponse.json({
    success: true,
    message: `Emergency contact ${removed.contactName} was removed.`,
    contacts: cachedContacts,
  });
}
