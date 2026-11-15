import { NextResponse } from "next/server";
import { 
  updateMemberRoleSchema, 
  suspendMemberSchema, 
  revokeMemberSchema 
} from "@/lib/validations/care-circle.schema";
import { 
  getCachedMembers, 
  getCachedTasks, 
  updateMemberRole, 
  suspendMember, 
  revokeMember 
} from "@/lib/data/care-circle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const members = getCachedMembers();
  const member = members.find((m) => m.id === id);

  if (!member) {
    return NextResponse.json({ error: "Care Circle member not found" }, { status: 404 });
  }

  const assignedTasks = getCachedTasks().filter((t) => t.assignedMemberId === id);

  return NextResponse.json({
    success: true,
    member,
    assignedTasks,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();

    // Check if suspending
    if (body.action === "suspend") {
      const parseResult = suspendMemberSchema.safeParse({
        memberId: id,
        suspensionReason: body.suspensionReason,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          { error: "A valid suspension reason of at least 5 characters is mandatory" },
          { status: 400 }
        );
      }

      const suspended = suspendMember(
        id,
        parseResult.data.suspensionReason,
        userPerspective.sampleName,
        userPerspective.label
      );

      return NextResponse.json({
        success: true,
        member: suspended,
        message: "Member access has been temporarily suspended.",
      });
    }

    // Role update
    const parseResult = updateMemberRoleSchema.safeParse({
      memberId: id,
      assignedRole: body.assignedRole,
      permissionTier: body.permissionTier,
      changeReason: body.changeReason,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const effectiveRole = parseResult.data.assignedRole || parseResult.data.newRole || "caregiver";
    const effectiveTier = parseResult.data.permissionTier || parseResult.data.newTier || "caregiver_editor";
    const { changeReason } = parseResult.data;

    const updated = updateMemberRole(
      id,
      effectiveRole,
      effectiveTier,
      changeReason,
      userPerspective.sampleName,
      userPerspective.label
    );

    return NextResponse.json({
      success: true,
      member: updated,
      message: "Member role and permissions successfully updated.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error updating member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = revokeMemberSchema.safeParse({
      memberId: id,
      revocationReason: body.revocationReason,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "A revocation reason of at least 5 characters is mandatory" },
        { status: 400 }
      );
    }

    const revoked = revokeMember(
      id,
      parseResult.data.revocationReason,
      userPerspective.sampleName,
      userPerspective.label
    );

    return NextResponse.json({
      success: true,
      member: revoked,
      message: "Member access has been permanently revoked and logged in audit history.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error revoking member access" },
      { status: 500 }
    );
  }
}
