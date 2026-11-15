import { NextResponse } from "next/server";
import {
  getCachedNotifications,
  scanAndScheduleModuleReminders,
} from "@/lib/data/notification-data";

export async function GET() {
  const scheduled = getCachedNotifications({ status: "scheduled" });

  return NextResponse.json({
    success: true,
    total: scheduled.length,
    scheduled,
  });
}

export async function POST() {
  const result = scanAndScheduleModuleReminders();

  const scheduled = getCachedNotifications({ status: "scheduled" });

  return NextResponse.json({
    success: true,
    message: `Discovered and scheduled ${result.newRemindersCount} proactive reminders across ${result.evaluatedRecords} clinical records.`,
    newRemindersCount: result.newRemindersCount,
    evaluatedRecords: result.evaluatedRecords,
    totalScheduled: scheduled.length,
    scheduled,
  });
}
