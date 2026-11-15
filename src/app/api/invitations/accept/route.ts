import { NextResponse } from "next/server";
import { createServerSideClient, getCurrentUser } from "@/lib/supabase/server";
import { acceptInvitationSchema } from "@/lib/validations/auth.schema";
import { hashToken } from "@/lib/auth/permissions";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (!user && !isDemo) {
      return NextResponse.json(
        { error: "You must be signed in to accept a care circle invitation" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = acceptInvitationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid invitation token format" },
        { status: 400 }
      );
    }

    const { invitationToken } = parseResult.data;
    const computedHash = hashToken(invitationToken);

    if (user) {
      const supabase = await createServerSideClient();

      // Retrieve invitation by token hash
      const { data: invitation, error } = await supabase
        .from("care_invitations")
        .select("*")
        .eq("token_hash", computedHash)
        .single();

      if (error || !invitation) {
        return NextResponse.json(
          { error: "Invitation not found or invalid token" },
          { status: 404 }
        );
      }

      // Check lifecycle status
      if (invitation.status === "accepted") {
        return NextResponse.json(
          { error: "This care invitation has already been redeemed" },
          { status: 400 }
        );
      }

      if (invitation.status === "revoked") {
        return NextResponse.json(
          { error: "This invitation was revoked by the care circle administrator" },
          { status: 400 }
        );
      }

      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from("care_invitations")
          .update({ status: "expired" })
          .eq("id", invitation.id);

        return NextResponse.json(
          { error: "This care invitation has expired" },
          { status: 400 }
        );
      }

      // Attach user to care_circle_members
      await supabase.from("care_circle_members").insert({
        patient_id: invitation.patient_id,
        member_id: user.id,
        circle_id: invitation.circle_id,
        name: invitation.invitee_name,
        email: invitation.email,
        role: invitation.role,
        relationship: invitation.relationship,
        permission_tier: invitation.permission_tier,
        status: "active",
        is_active: true,
      });

      // Mark invitation accepted
      await supabase
        .from("care_invitations")
        .update({
          status: "accepted",
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      // Append immutable audit log
      await supabase.from("audit_events").insert({
        patient_id: invitation.patient_id,
        actor_id: user.id,
        actor_name: user.email || invitation.invitee_name,
        actor_role: invitation.role,
        event_category: "consent",
        event_action: "invitation_accepted",
        severity: "info",
        details: {
          invitation_id: invitation.id,
          permission_tier: invitation.permission_tier,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Care Circle invitation accepted successfully. You now have authorized access.",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while processing invitation acceptance" },
      { status: 500 }
    );
  }
}
