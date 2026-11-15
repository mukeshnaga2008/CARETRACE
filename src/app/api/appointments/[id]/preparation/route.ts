import { NextResponse } from "next/server";
import { createPreparationItemSchema } from "@/lib/validations/appointment.schema";
import { 
  getCachedPreparationItems, 
  addPreparationItem, 
  togglePreparationItem,
  deletePreparationItem
} from "@/lib/data/appointment-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { AppointmentPreparationItem } from "@/types/caretrace";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const items = getCachedPreparationItems(id);

  return NextResponse.json({
    success: true,
    preparationItems: items,
  });
}

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
    const parseResult = createPreparationItemSchema.safeParse({
      ...body,
      appointmentId: id,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { itemType, title, notes } = parseResult.data;

    const newItem: AppointmentPreparationItem = {
      id: `prep-${Date.now()}`,
      appointmentId: id,
      patientId: "patient-profile-001",
      itemType,
      title,
      notes: notes || undefined,
      isAddressed: false,
      createdByName: userPerspective.sampleName,
      createdByRole: userPerspective.label,
      createdAt: new Date().toISOString(),
    };

    addPreparationItem(newItem);

    return NextResponse.json(
      {
        success: true,
        item: newItem,
        message: "Preparation item successfully linked to visit agenda.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error adding preparation item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { itemId, addressedNotes } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Preparation Item ID is required" }, { status: 400 });
    }

    const updated = togglePreparationItem(itemId, addressedNotes);

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error updating preparation item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Preparation Item ID is required" }, { status: 400 });
    }

    const deleted = deletePreparationItem(itemId);

    return NextResponse.json({
      success: deleted,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error removing preparation item" },
      { status: 500 }
    );
  }
}
