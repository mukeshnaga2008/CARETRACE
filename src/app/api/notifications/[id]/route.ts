import { NextResponse } from "next/server";
import {
  getNotificationById,
  markNotificationRead,
  archiveNotification,
  getDeliveryAttemptsForNotification,
} from "@/lib/data/notification-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const notification = getNotificationById(id);

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const deliveryAttempts = getDeliveryAttemptsForNotification(id);

  return NextResponse.json({
    success: true,
    notification,
    deliveryAttempts,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    if (body.action === "archive") {
      const updated = archiveNotification(id);
      if (!updated) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        notification: updated,
        message: "Notification moved to archive.",
      });
    }

    if (typeof body.isRead === "boolean") {
      const updated = markNotificationRead(id, body.isRead);
      if (!updated) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        notification: updated,
        message: body.isRead ? "Marked as read." : "Marked as unread.",
      });
    }

    return NextResponse.json({ error: "Invalid patch action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error updating notification", details: String(error) },
      { status: 500 }
    );
  }
}
