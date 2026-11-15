import { NextResponse } from "next/server";
import { createFollowUpTaskSchema } from "@/lib/validations/appointment.schema";
import { 
  getCachedFollowUpTasks, 
  addFollowUpTask, 
  updateFollowUpTaskStatus 
} from "@/lib/data/appointment-intelligence-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { AppointmentFollowUpTask } from "@/types/caretrace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get("appointmentId") || undefined;
  const statusFilter = searchParams.get("status") || "all";

  let tasks = getCachedFollowUpTasks(appointmentId);

  if (statusFilter !== "all") {
    tasks = tasks.filter((t) => t.taskStatus === statusFilter);
  }

  // Sort by due date
  tasks.sort((a, b) => {
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return a.dueAt.localeCompare(b.dueAt);
  });

  return NextResponse.json({
    success: true,
    tasks,
    total: tasks.length,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demoRole = (cookieStore.get("caretrace_demo_role")?.value as AppRole) || "family";
  const userPerspective = USER_PERSPECTIVES[demoRole];

  try {
    const body = await request.json();
    const parseResult = createFollowUpTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const newTask: AppointmentFollowUpTask = {
      id: `task-${Date.now()}`,
      patientId: "patient-profile-001",
      appointmentId: data.appointmentId,
      title: data.title,
      description: data.description,
      dueAt: data.dueAt || undefined,
      assignedToName: data.assignedToName || undefined,
      assignedToRole: data.assignedToRole || undefined,
      taskStatus: data.taskStatus,
      sourceReference: body.sourceReference || "Doctor Visit Follow-up",
      createdByName: userPerspective.sampleName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addFollowUpTask(newTask);

    return NextResponse.json(
      {
        success: true,
        task: newTask,
        message: "Follow-up task created and assigned.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error creating follow-up task" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { taskId, newStatus, completionNotes } = body;

    if (!taskId || !newStatus) {
      return NextResponse.json(
        { error: "Task ID and newStatus are required" },
        { status: 400 }
      );
    }

    const updated = updateFollowUpTaskStatus(taskId, newStatus, completionNotes);

    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      task: updated,
      message: `Task status updated to ${newStatus}.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error updating task status" },
      { status: 500 }
    );
  }
}
