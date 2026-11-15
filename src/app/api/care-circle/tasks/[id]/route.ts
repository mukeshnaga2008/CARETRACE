import { NextResponse } from "next/server";
import { 
  updateCareTaskStatusSchema, 
  reassignTaskSchema 
} from "@/lib/validations/care-circle.schema";
import { 
  getCachedTasks, 
  updateCareTaskStatus, 
  reassignCareTask 
} from "@/lib/data/care-circle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tasks = getCachedTasks();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return NextResponse.json({ error: "Care task not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    task,
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

    // Reassignment
    if (body.action === "reassign") {
      const parseResult = reassignTaskSchema.safeParse({
        taskId: id,
        assignedMemberId: body.assignedMemberId,
        assignedMemberName: body.assignedMemberName,
        assignedMemberRole: body.assignedMemberRole,
        reassignReason: body.reassignReason,
      });

      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const reassigned = reassignCareTask(
        id,
        parseResult.data.assignedMemberId,
        parseResult.data.assignedMemberName,
        parseResult.data.assignedMemberRole,
        parseResult.data.reassignReason,
        userPerspective.sampleName
      );

      return NextResponse.json({
        success: true,
        task: reassigned,
        message: `Task successfully reassigned to ${parseResult.data.assignedMemberName}.`,
      });
    }

    // Status change
    const parseResult = updateCareTaskStatusSchema.safeParse({
      taskId: id,
      status: body.status,
      completionNotes: body.completionNotes,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = updateCareTaskStatus(
      id,
      parseResult.data.status,
      parseResult.data.completionNotes,
      userPerspective.sampleName
    );

    return NextResponse.json({
      success: true,
      task: updated,
      message: `Task status updated to ${parseResult.data.status}.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error updating task" },
      { status: 500 }
    );
  }
}
