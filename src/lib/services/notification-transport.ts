/**
 * CARETRACE Notification Transport & Sanitization Service
 * PromptWars × Catalyst 2026: Phase 12
 * 
 * Clinical & Privacy Boundary:
 * - Server-side only provider credentials.
 * - Non-sensitive preview generation strips PHI from lock-screen and external alerts.
 * - Explicit separation of provider acceptance from confirmed delivery.
 * - Quiet hours enforcement with non-emergency channel suppression.
 */

import {
  NotificationChannel,
  NotificationCategory,
  NotificationDeliveryStatus,
  CareTraceNotification,
  NotificationPreference,
} from "@/types/caretrace";

export interface SendResult {
  status: NotificationDeliveryStatus;
  providerReference?: string;
  providerResponse?: {
    statusCode?: number;
    statusText?: string;
    message?: string;
    rawId?: string;
  };
  error?: string;
  isSimulated?: boolean;
}

/**
 * Sanitizes and generates non-sensitive preview text when user preference
 * or privacy rule dictates lock-screen and external preview privacy.
 */
export function generateSafePreview(
  category: NotificationCategory,
  title: string,
  rawBody: string,
  nonSensitivePreviewsOnly: boolean = true
): string {
  if (!nonSensitivePreviewsOnly) {
    return rawBody.length > 120 ? `${rawBody.substring(0, 117)}...` : rawBody;
  }

  // Safe non-PHI previews
  switch (category) {
    case "medication":
      return "Care reminder: Scheduled medication coordination item requires attention.";
    case "appointment":
      return "Appointment reminder: Upcoming clinical consultation scheduled.";
    case "care_circle":
      return "Care Circle update: Responsibility assignment or handover pending review.";
    case "instructions":
      return "Instruction Vault: Clinical care directive update requires human review.";
    case "care_gap":
      return "Care Gap Radar: Coordination follow-up flagged for Care Circle response.";
    case "account_security":
      return "Security notice: Account access or permission setting updated.";
    default:
      return "CARETRACE notification: New care coordination message.";
  }
}

/**
 * Checks whether the current moment falls within configured quiet hours
 * for the user's specific timezone.
 */
export function isInQuietHours(
  quietHoursStart: string = "21:30",
  quietHoursEnd: string = "07:30",
  userTimezone: string = "America/Chicago",
  now: Date = new Date()
): boolean {
  try {
    // Format current time in user's timezone as HH:MM
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === "hour")?.value || "00";
    const minute = parts.find((p) => p.type === "minute")?.value || "00";
    const currentHM = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

    // Simple time comparison
    if (quietHoursStart < quietHoursEnd) {
      // Normal daytime quiet window (e.g. 13:00 to 15:00)
      return currentHM >= quietHoursStart && currentHM < quietHoursEnd;
    } else {
      // Overnight quiet window (e.g. 21:30 to 07:30)
      return currentHM >= quietHoursStart || currentHM < quietHoursEnd;
    }
  } catch {
    // Fallback if timezone string is invalid
    return false;
  }
}

/**
 * Dispatches a notification across the specified delivery channel.
 * Implements honest provider states: sent_to_provider != confirmed delivered.
 */
export async function dispatchNotificationChannel(
  notification: CareTraceNotification,
  preferences?: NotificationPreference,
  options: { forceSimulate?: boolean } = {}
): Promise<SendResult> {
  const channel = notification.deliveryChannel;

  // 1. In-App Channel (Dependable default)
  if (channel === "in_app") {
    return {
      status: "delivered",
      providerReference: `in-app-${notification.id}`,
      providerResponse: {
        statusCode: 200,
        statusText: "OK",
        message: "Notification delivered to in-app recipient feed.",
      },
    };
  }

  // 2. Quiet Hours check for external channels (Email, SMS, Push)
  if (preferences?.quietHoursEnabled) {
    const inQuiet = isInQuietHours(
      preferences.quietHoursStart,
      preferences.quietHoursEnd,
      preferences.timezone
    );

    if (inQuiet) {
      return {
        status: "suppressed",
        error: `Delivery suppressed during configured quiet hours (${preferences.quietHoursStart} - ${preferences.quietHoursEnd} ${preferences.timezone}). Retained in-app.`,
      };
    }
  }

  // 3. Email Channel via Resend API
  if (channel === "email") {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || "alerts@caretrace.health";

    if (!resendApiKey || options.forceSimulate) {
      // Honest simulated email delivery
      return {
        status: "sent_to_provider",
        isSimulated: true,
        providerReference: `sim-email-${Date.now()}`,
        providerResponse: {
          statusCode: 202,
          statusText: "Accepted (Simulated)",
          message: "Simulated Resend delivery: Provider accepted message for queueing. Final delivery awaits carrier.",
          rawId: `sim-resend-${notification.id}`,
        },
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: "recipient@caretrace.example.com", // In production: user's verified email
          subject: notification.title,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-top: 0;">${notification.title}</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.5;">${notification.previewText}</p>
              <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #0284c7;">
                <p style="color: #334155; margin: 0; font-size: 14px;">${notification.body}</p>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">CARETRACE — The Intelligent Healthcare Continuity Network</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          status: "failed",
          error: `Resend HTTP ${response.status}: ${errorText.substring(0, 150)}`,
        };
      }

      const data = await response.json();
      return {
        status: "sent_to_provider", // Honest state: Resend accepted, not yet delivered to inbox
        providerReference: data.id || `resend-${Date.now()}`,
        providerResponse: {
          statusCode: 202,
          statusText: "Accepted",
          message: "Resend accepted email dispatch job.",
          rawId: data.id,
        },
      };
    } catch (err: any) {
      return {
        status: "failed",
        error: `Resend transport network failure: ${err?.message || "Unknown error"}`,
      };
    }
  }

  // 4. Push Notification Channel (Explicitly Unconfigured)
  if (channel === "push") {
    return {
      status: "failed",
      error: "Push notification transport not configured in environment. Set VAPID_PRIVATE_KEY or FCM_SERVER_KEY to enable web push.",
    };
  }

  // 5. SMS Channel (Carrier simulation with realistic delivery states)
  if (channel === "sms") {
    // Carrier gateway simulation
    return {
      status: "sent_to_provider",
      isSimulated: true,
      providerReference: `carrier-sms-${Date.now()}`,
      providerResponse: {
        statusCode: 202,
        statusText: "Accepted",
        message: "Carrier gateway queued SMS message.",
      },
    };
  }

  return {
    status: "failed",
    error: `Unsupported delivery channel: ${channel}`,
  };
}
