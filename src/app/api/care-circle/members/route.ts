import { NextResponse } from "next/server";
import { 
  getCachedMembers, 
  addMember 
} from "@/lib/data/care-circle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { CareCircleMember } from "@/types/caretrace";

export async function GET() {
  const members = getCachedMembers();
  return NextResponse.json({
    success: true,
    members,
    total: members.length,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const { name, email, phone, relationship, assignedRole, permissionTier } = body;

    if (!name || !relationship) {
      return NextResponse.json(
        { error: "Name and relationship are required fields" },
        { status: 400 }
      );
    }

    const newMember: CareCircleMember = {
      id: `member-${Date.now()}`,
      patientId: "patient-profile-001",
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      relationship: relationship.trim(),
      assignedRole: assignedRole || "family_member",
      permissionTier: permissionTier || "family_viewer",
      emergencyPriority: 5,
      isActive: true,
      membershipStatus: "active",
      joinedAt: new Date().toISOString(),
      permissions: [
        "view_profile",
        "view_health_summary",
        "view_appointments",
      ],
      currentResponsibilities: [],
      lastActiveAt: "Just now",
    };

    addMember(newMember);

    return NextResponse.json(
      {
        success: true,
        member: newMember,
        message: `${newMember.name} has been added to Margaret's Care Circle.`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error adding Care Circle member" },
      { status: 500 }
    );
  }
}
