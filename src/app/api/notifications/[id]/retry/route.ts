import { NextResponse } from "next/server";
import { retryFailedNotification } from "@/lib/data/notification-data";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";

  try {
    const result = await retryFailedNotification(id, demoRole);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Retry failed to deliver",
          details: result.error,
          notification: result.notification,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: result.notification,
      message: "Delivery re-attempted and submitted to transport broker.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error during delivery retry", details: String(error) },
      { status: 500 }
    );
  }
}
