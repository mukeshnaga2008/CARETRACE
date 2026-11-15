import { NextResponse } from "next/server";
import {
  getCachedNotifications,
  getDeliveryAttemptsForNotification,
} from "@/lib/data/notification-data";

export async function GET() {
  const failed = getCachedNotifications({ status: "failed" });

  const withAttempts = failed.map((notif) => ({
    ...notif,
    attempts: getDeliveryAttemptsForNotification(notif.id),
  }));

  return NextResponse.json({
    success: true,
    total: failed.length,
    failed: withAttempts,
  });
}
