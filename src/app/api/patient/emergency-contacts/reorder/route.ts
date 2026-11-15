import { NextResponse } from "next/server";
import { emergencyContactReorderSchema } from "@/lib/validations/patient-profile.schema";
import { INITIAL_EMERGENCY_CONTACTS } from "@/lib/data/patient-profile-data";
import { EmergencyContact } from "@/types/caretrace";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

let cachedContacts: EmergencyContact[] = [...INITIAL_EMERGENCY_CONTACTS];

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "patient";

  if (demoRole === "caregiver") {
    return NextResponse.json(
      { error: "Caregivers cannot reorder emergency priority." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parseResult = emergencyContactReorderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid reorder payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { contacts: updates } = parseResult.data;

    // Apply new priority orders
    updates.forEach((u) => {
      const match = cachedContacts.find((c) => c.id === u.id);
      if (match) {
        match.priorityOrder = u.priorityOrder;
        match.updatedAt = new Date().toISOString();
      }
    });

    cachedContacts.sort((a, b) => a.priorityOrder - b.priorityOrder);

    return NextResponse.json({
      success: true,
      message: "Emergency contact priorities successfully reordered.",
      contacts: cachedContacts,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reorder emergency contacts." },
      { status: 500 }
    );
  }
}
