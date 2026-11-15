import { NextResponse } from "next/server";
import { createServerSideClient, getCurrentUser } from "@/lib/supabase/server";
import {
  consentRecordSchema,
  consentRevocationSchema,
} from "@/lib/validations/auth.schema";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (!user && !isDemo) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = consentRecordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { patientId, recipientId, scope, purpose, expiresAt } = parseResult.data;

    if (user) {
      const supabase = await createServerSideClient();

      const { data, error } = await supabase
        .from("consent_records")
        .insert({
          patient_id: patientId,
          grantor_id: user.id,
          recipient_id: recipientId,
          scope,
          purpose,
          status: "active",
          is_active: true,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to establish consent record: " + error.message },
          { status: 500 }
        );
      }

      // Append audit event
      await supabase.from("audit_events").insert({
        patient_id: patientId,
        actor_id: user.id,
        actor_name: user.email || "Patient / Authorized Grantor",
        actor_role: "patient",
        event_category: "consent",
        event_action: "consent_granted",
        severity: "info",
        details: {
          scope,
          purpose,
          recipient_id: recipientId,
        },
      });

      return NextResponse.json({ success: true, consent: data });
    }

    return NextResponse.json({
      success: true,
      message: "Consent record successfully granted in evaluation session",
      consent: {
        id: "demo-consent-" + Date.now(),
        patientId,
        recipientId,
        scope,
        purpose,
        status: "active",
        grantedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while granting consent" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (!user && !isDemo) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = consentRevocationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { consentId, reason } = parseResult.data;

    if (user) {
      const supabase = await createServerSideClient();

      const { data: record, error: fetchError } = await supabase
        .from("consent_records")
        .select("*")
        .eq("id", consentId)
        .single();

      if (fetchError || !record) {
        return NextResponse.json({ error: "Consent record not found" }, { status: 404 });
      }

      if (record.status === "revoked") {
        return NextResponse.json(
          { error: "This consent record has already been revoked" },
          { status: 400 }
        );
      }

      await supabase
        .from("consent_records")
        .update({
          status: "revoked",
          is_active: false,
          revoked_at: new Date().toISOString(),
          revocation_reason: reason,
        })
        .eq("id", consentId);

      // Record audit event
      await supabase.from("audit_events").insert({
        patient_id: record.patient_id,
        actor_id: user.id,
        actor_name: user.email || "Patient / Authorized Grantor",
        actor_role: "patient",
        event_category: "consent",
        event_action: "consent_revoked",
        severity: "warning",
        details: {
          consent_id: consentId,
          scope: record.scope,
          revocation_reason: reason,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Consent record successfully revoked. Access has been immediately terminated.",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while revoking consent" },
      { status: 500 }
    );
  }
}
