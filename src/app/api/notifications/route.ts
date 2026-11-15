import { NextResponse } from "next/server";
import {
  getCachedNotifications,
  createCareTraceNotification,
  markAllNotificationsRead,
} from "@/lib/data/notification-data";
import { createNotificationSchema } from "@/lib/validations/notifications.schema";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;
  const readStatus = searchParams.get("readStatus") || undefined;
  const requiresAckParam = searchParams.get("requiresAck");
  const requiresAck = requiresAckParam !== null ? requiresAckParam === "true" : undefined;
  const search = searchParams.get("search")?.toLowerCase();

  let notifications = getCachedNotifications({
    category,
    status,
    readStatus,
    requiresAck,
  });

  if (search) {
    notifications = notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(search) ||
        n.body.toLowerCase().includes(search) ||
        n.previewText.toLowerCase().includes(search) ||
        n.recipientName.toLowerCase().includes(search)
    );
  }

  const all = getCachedNotifications();
  const unreadCount = all.filter((n) => !n.isRead && n.readStatus !== "archived").length;
  const pendingAckCount = all.filter((n) => n.requiresAcknowledgement && n.acknowledgementStatus === "pending").length;
  const scheduledCount = all.filter((n) => n.deliveryStatus === "scheduled").length;
  const failedCount = all.filter((n) => n.deliveryStatus === "failed").length;

  return NextResponse.json({
    success: true,
    total: notifications.length,
    counts: {
      unread: unreadCount,
      pendingAck: pendingAckCount,
      scheduled: scheduledCount,
      failed: failedCount,
      total: all.length,
    },
    notifications,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole] || USER_PERSPECTIVES.family;

  try {
    const body = await request.json();

    // Check if bulk mark-all-read action
    if (body.action === "mark_all_read") {
      const count = markAllNotificationsRead(body.recipientId);
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notifications as read.`,
        count,
      });
    }

    const parseResult = createNotificationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { notification, isDuplicate } = await createCareTraceNotification(
      parseResult.data,
      demoRole
    );

    return NextResponse.json(
      {
        success: true,
        notification,
        isDuplicate,
        message: isDuplicate
          ? "Notification already exists with this idempotency key; duplicate suppressed."
          : "Notification created and queued for delivery.",
      },
      { status: isDuplicate ? 200 : 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error creating notification", details: String(error) },
      { status: 500 }
    );
  }
}
