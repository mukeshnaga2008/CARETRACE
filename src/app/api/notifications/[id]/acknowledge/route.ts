import { NextResponse } from "next/server";
import { acknowledgeNotification } from "@/lib/data/notification-data";
import { acknowledgeNotificationSchema } from "@/lib/validations/notifications.schema";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.family;

  try {
    const body = await request.json();
    const parseResult = acknowledgeNotificationSchema.safeParse({
      ...body,
      notificationId: id,
      acknowledgedById: body.acknowledgedById || userPerspective.sampleName,
      acknowledgedByName: body.acknowledgedByName || userPerspective.sampleName,
      acknowledgedByRole: body.acknowledgedByRole || userPerspective.label,
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

    const { acknowledgedById, acknowledgedByName, acknowledgedByRole, note } = parseResult.data;

    const result = acknowledgeNotification(
      id,
      acknowledgedById,
      acknowledgedByName,
      acknowledgedByRole || userPerspective.label,
      note
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      notification: result.notification,
      message: "Notification responsibility explicitly acknowledged and recorded in audit history.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error during acknowledgement", details: String(error) },
      { status: 500 }
    );
  }
}
