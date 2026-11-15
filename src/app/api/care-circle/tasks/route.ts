import { NextResponse } from "next/server";
import { createCareTaskSchema } from "@/lib/validations/care-circle.schema";
import { 
  getCachedTasks, 
  addCareTask 
} from "@/lib/data/care-circle-data";
import { cookies } from "next/headers";
import { AppRole, USER_PERSPECTIVES } from "@/lib/constants";
import { CareTask } from "@/types/caretrace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let tasks = getCachedTasks();

  if (memberId) {
    tasks = tasks.filter((t) => t.assignedMemberId === memberId);
  }
  if (status && status !== "all") {
    tasks = tasks.filter((t) => t.status === status);
  }
  if (category && category !== "all") {
    tasks = tasks.filter((t) => t.category === category);
  }

  // Sort by due date
  tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

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
    const parseResult = createCareTaskSchema.safeParse(body);

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

    const newTask: CareTask = {
      id: `task-${Date.now()}`,
      patientId: data.patientId,
      title: data.title,
      category: data.category,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      status: data.assignedMemberId ? "assigned" : "unassigned",
      assignedMemberId: data.assignedMemberId || undefined,
      assignedMemberName: data.assignedMemberName || undefined,
      assignedMemberRole: data.assignedMemberRole || undefined,
      isRecurring: data.isRecurring,
      recurrenceRule: data.recurrenceRule || undefined,
      timezone: data.timezone,
      relatedMedicationId: data.relatedMedicationId || undefined,
      relatedAppointmentId: data.relatedAppointmentId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCareTask(newTask);

    return NextResponse.json(
      {
        success: true,
        task: newTask,
        message: "Care task created and assigned to Care Circle.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error creating care task" },
      { status: 500 }
    );
  }
}
