import { NextResponse } from "next/server";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  patientName: z.string().optional(),
  patientId: z.string().optional(),
});

interface AssistantResponse {
  reply: string;
  suggestedLinks?: { label: string; href: string }[];
  isClinicalBoundaryNote: boolean;
}

function generateAssistantResponse(
  query: string, 
  patientName: string = "Margaret Sullivan",
  patientId?: string
): AssistantResponse {
  const q = query.toLowerCase();

  // Clinical boundary check (diagnosis, symptom checks, altering meds)
  const isMedicalAdviceRequest =
    q.includes("diagnos") ||
    q.includes("cure") ||
    q.includes("should i take") ||
    q.includes("change my dose") ||
    q.includes("stop taking") ||
    q.includes("chest pain") ||
    q.includes("heart attack") ||
    q.includes("stroke");

  if (isMedicalAdviceRequest) {
    return {
      reply:
        "SAFETY NOTICE: I am the CARETRACE Care Navigation Assistant, not a medical doctor. I cannot provide medical diagnoses, clinical treatment advice, or alter prescription dosages. If you are experiencing an acute medical emergency such as severe chest pain, shortness of breath, or sudden weakness, please dial 911 immediately or contact your physician.",
      suggestedLinks: [
        { label: "Emergency Contacts", href: "/profile" },
        { label: "Care Circle Members", href: "/care-circle" },
      ],
      isClinicalBoundaryNote: true,
    };
  }

  // Medications
  if (q.includes("med") || q.includes("pill") || q.includes("dose") || q.includes("prescription")) {
    return {
      reply:
        `${patientName}'s active prescriptions are managed in the Medications module. You can view the scheduled morning, afternoon, and evening dose windows, record dose confirmations, check adherence trends, and request prescription refills.`,
      suggestedLinks: [
        { label: "Medication Schedule", href: "/medications" },
        { label: "Adherence Log", href: "/medications/adherence" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Appointments
  if (q.includes("appoint") || q.includes("visit") || q.includes("doctor") || q.includes("calendar")) {
    return {
      reply:
        `Doctor visits, clinic consultations, and therapy sessions for ${patientName} are tracked in Appointments. You can review upcoming dates, designate family escorts, complete pre-visit preparation checklists, and log post-visit clinician follow-ups.`,
      suggestedLinks: [
        { label: "Upcoming Visits", href: "/appointments/upcoming" },
        { label: "Visit Calendar", href: "/appointments/calendar" },
        { label: "Pre-Visit Prep", href: "/appointments/preparation" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Care Circle
  if (q.includes("circle") || q.includes("family") || q.includes("nurse") || q.includes("caregiver") || q.includes("handover")) {
    return {
      reply:
        `The Care Circle connects ${patientName} with authorized family caregivers and clinicians. Here you can assign shared care tasks, acknowledge shift handovers, and coordinate daily care responsibilities.`,
      suggestedLinks: [
        { label: "Care Circle Overview", href: "/care-circle" },
        { label: "Care Tasks", href: "/care-circle/tasks" },
        { label: "Shift Handovers", href: "/care-circle/handover" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Care Continuity Engine
  if (q.includes("continuity") || q.includes("instruction") || q.includes("review") || q.includes("diff") || q.includes("vault")) {
    return {
      reply:
        `The Care Continuity Engine detects when clinician instructions change for ${patientName}. It highlights diffs against active medication schedules and creates explainable human-review tasks so no care transition is missed or misunderstood.`,
      suggestedLinks: [
        { label: "Instruction Vault", href: "/instructions" },
        { label: "Continuity Reviews", href: "/continuity" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Care Gaps / Radar
  if (q.includes("gap") || q.includes("radar") || q.includes("alert") || q.includes("risk")) {
    return {
      reply:
        `The Care Gap Radar actively scans for coordination lapses for ${patientName}: missed doses, unescorted appointments, missing shift acknowledgments, and unverified discharge instructions. Items are triaged by severity: Critical, Warning, or Advisory.`,
      suggestedLinks: [
        { label: "Care Gap Radar", href: "/care-gaps" },
        { label: "Resolution Queue", href: "/care-gaps/active" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Care Passport
  if (q.includes("passport") || q.includes("export") || q.includes("pdf") || q.includes("emergency") || q.includes("qr")) {
    return {
      reply:
        `The Care Passport provides a controlled, verifiable medical summary for ${patientName}. You can view the emergency profile, generate offline-ready PDF documents, or share a time-limited PIN-protected QR code.`,
      suggestedLinks: [
        { label: "Care Passport", href: "/care-passport" },
        { label: "Export Medical Summary", href: "/care-passport/export" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Timeline / History / Audit
  if (q.includes("timeline") || q.includes("history") || q.includes("audit") || q.includes("log")) {
    return {
      reply:
        `The Care Timeline displays an immutable, chronological record of every medication dose, clinician instruction, appointment attendance, and Care Circle action across ${patientName}'s care journey.`,
      suggestedLinks: [
        { label: "Care Timeline", href: "/timeline" },
        { label: "Coordination Analytics", href: "/analytics" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Privacy & Access
  if (q.includes("privacy") || q.includes("consent") || q.includes("security") || q.includes("break-glass")) {
    return {
      reply:
        `CARETRACE enforces granular patient consent controls and Row-Level Security (RLS) for ${patientName}. You can inspect active consent scopes, review audit logs, and inspect emergency break-glass records in the Privacy & Access module.`,
      suggestedLinks: [
        { label: "Privacy & Consent", href: "/privacy" },
        { label: "Settings", href: "/settings" },
      ],
      isClinicalBoundaryNote: false,
    };
  }

  // Default response
  return {
    reply:
      `Hello! I am your CARETRACE assistant. I can help you find information across ${patientName}'s care plan, navigate modules, or understand features like the Care Continuity Engine, Care Gap Radar, and Care Passport. What would you like to explore?`,
    suggestedLinks: [
      { label: "Medications", href: "/medications" },
      { label: "Appointments", href: "/appointments" },
      { label: "Care Circle", href: "/care-circle" },
      { label: "Care Passport", href: "/care-passport" },
    ],
    isClinicalBoundaryNote: false,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query message" }, { status: 400 });
    }

    const patientName = parseResult.data.patientName || "Margaret Sullivan";
    const patientId = parseResult.data.patientId;
    const response = generateAssistantResponse(parseResult.data.message, patientName, patientId);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to process assistant request" },
      { status: 500 }
    );
  }
}
