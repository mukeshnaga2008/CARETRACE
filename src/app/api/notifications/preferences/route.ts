import { NextResponse } from "next/server";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/data/notification-data";
import { updateNotificationPreferencesSchema } from "@/lib/validations/notifications.schema";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

export async function GET() {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";

  const preferences = getUserNotificationPreferences(demoRole);

  return NextResponse.json({
    success: true,
    preferences,
  });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";

  try {
    const body = await request.json();
    const parseResult = updateNotificationPreferencesSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = updateUserNotificationPreferences(demoRole, parseResult.data);

    return NextResponse.json({
      success: true,
      preferences: updated,
      message: "Notification preferences and quiet hours updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error updating preferences", details: String(error) },
      { status: 500 }
    );
  }
}
