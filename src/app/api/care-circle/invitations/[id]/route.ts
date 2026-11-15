import { NextResponse } from "next/server";
import { cancelInvitation, getCachedInvitations } from "@/lib/data/care-circle-data";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const success = cancelInvitation(id);

  if (!success) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Invitation has been successfully cancelled.",
  });
}
