import { NextResponse } from "next/server";
import { processNotificationQueue } from "@/lib/data/notification-data";
import { processQueueSchema } from "@/lib/validations/notifications.schema";
import { safeCompare } from "@/lib/auth/permissions";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export async function POST(request: Request) {
  // 1. Rate limiting check (max 60 queue executions per minute)
  const rateLimit = checkRateLimit("cron_process_queue", 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many queue runner requests. Try again later." },
      { status: 429 }
    );
  }

  // 2. Check authorization: Constant-time Bearer token comparison against CRON_SECRET
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    if (!safeCompare(authHeader, expected)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing CRON_SECRET authorization header" },
        { status: 401 }
      );
    }
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable for standard cron triggers
    }

    const parseResult = processQueueSchema.safeParse(body);
    const currentTime = parseResult.success && parseResult.data.currentTime
      ? parseResult.data.currentTime
      : new Date().toISOString();

    const result = await processNotificationQueue(currentTime);

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
      errors: result.errors,
      processedAt: currentTime,
      message: `Processed ${result.processedCount} queued reminders successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error during queue processing", details: String(error) },
      { status: 500 }
    );
  }
}
