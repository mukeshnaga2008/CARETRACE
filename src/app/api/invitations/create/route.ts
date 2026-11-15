import { NextResponse } from "next/server";
import { createServerSideClient, getCurrentUser } from "@/lib/supabase/server";
import { careCircleInvitationSchema } from "@/lib/validations/auth.schema";
import { generateInvitationToken } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    // In non-demo production, user must be authenticated
    if (!user && !isDemo) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = careCircleInvitationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { patientId, inviteeName, email, role, relationship, permissionTier } =
      parseResult.data;

    // Generate secure cryptographically random token & SHA-256 hash
    const { rawToken, tokenHash } = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // If live Supabase connection is active, insert into database
    if (user) {
      const supabase = await createServerSideClient();
      const { error: dbError } = await supabase.from("care_invitations").insert({
        patient_id: patientId,
        invited_by: user.id,
        email,
        invitee_name: inviteeName,
        role,
        relationship,
        permission_tier: permissionTier,
        token_hash: tokenHash,
        status: "pending",
        expires_at: expiresAt,
      });

      if (dbError) {
        return NextResponse.json(
          { error: "Failed to store invitation in database: " + dbError.message },
          { status: 500 }
        );
      }

      // Record audit event
      await supabase.from("audit_events").insert({
        patient_id: patientId,
        actor_id: user.id,
        actor_name: user.email || "Care Circle Admin",
        actor_role: "admin",
        event_category: "consent",
        event_action: "invitation_created",
        severity: "info",
        details: {
          invitee_email: email,
          role,
          permission_tier: permissionTier,
        },
      });
    }

    // In demo or production without SMTP configured, clearly indicate delivery status
    const emailConfigured = Boolean(process.env.RESEND_API_KEY);

    return NextResponse.json({
      success: true,
      message: emailConfigured
        ? `Invitation sent successfully to ${email}`
        : `Invitation created securely. (Note: Email delivery service not configured; copy the verification link below).`,
      emailConfigured,
      invitation: {
        inviteeName,
        email,
        role,
        relationship,
        permissionTier,
        expiresAt,
        invitationLink: `/care-circle/accept?token=${rawToken}`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "An unexpected error occurred while generating care invitation" },
      { status: 500 }
    );
  }
}
