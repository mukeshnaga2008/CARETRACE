import { NextResponse } from "next/server";
import { inviteMemberSchema } from "@/lib/validations/care-circle.schema";
import { 
  getCachedInvitations, 
  addInvitation, 
  cancelInvitation 
} from "@/lib/data/care-circle-data";
import { generateInvitationToken } from "@/lib/auth/permissions";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { Invitation } from "@/types/caretrace";

export async function GET() {
  const invitations = getCachedInvitations();
  return NextResponse.json({
    success: true,
    invitations,
    total: invitations.length,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = inviteMemberSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { patientId, email, name, relationship, permissionTier } = parseResult.data;

    // Duplicate check: Is there already a pending invitation for this email?
    const existing = getCachedInvitations().find(
      (inv) => inv.email.toLowerCase() === email.toLowerCase() && inv.status === "pending"
    );

    if (existing) {
      return NextResponse.json(
        { error: `An active pending invitation for ${email} already exists.` },
        { status: 409 }
      );
    }

    const { rawToken } = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const newInvitation: Invitation = {
      id: `inv-${Date.now()}`,
      patientId,
      invitedBy: userPerspective.sampleName,
      email,
      inviteeName: name,
      relationship,
      permissionTier,
      token: rawToken,
      status: "pending",
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    addInvitation(newInvitation);

    return NextResponse.json(
      {
        success: true,
        invitation: newInvitation,
        message: `Secure invitation created for ${name} (${email}). In demo mode, invitation token is staged.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error creating invitation" },
      { status: 500 }
    );
  }
}
