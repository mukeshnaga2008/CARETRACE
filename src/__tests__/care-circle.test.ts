import { describe, it, expect } from "vitest";
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  suspendMemberSchema,
  revokeMemberSchema,
  createCareTaskSchema,
  updateCareTaskStatusSchema,
  reassignTaskSchema,
  createHandoverSchema,
  acknowledgeHandoverSchema,
  clarificationHandoverSchema,
} from "@/lib/validations/care-circle.schema";
import {
  INITIAL_CARE_MEMBERS,
  INITIAL_CARE_TASKS,
  INITIAL_HANDOVERS,
  INITIAL_INVITATIONS,
  INITIAL_ACTIVITIES,
  getCachedMembers,
  getCachedTasks,
  getCachedHandovers,
  getCachedInvitations,
  getCachedActivities,
  addMember,
  updateMemberRole,
  suspendMember,
  revokeMember,
  addInvitation,
  cancelInvitation,
  addCareTask,
  updateCareTaskStatus,
  reassignCareTask,
  addHandover,
  acknowledgeHandover,
  requestHandoverClarification,
} from "@/lib/data/care-circle-data";
import fs from "fs";
import path from "path";

describe("Phase 8: Care Circle Family & Caregiver Collaboration", () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Validation Schemas                                                      */
  /* -------------------------------------------------------------------------- */
  describe("Care Circle Validation Schemas", () => {
    it("should accept valid member invitation payload", () => {
      const payload = {
        patientId: "patient-profile-001",
        email: "elena.pt@rehabpartners.org",
        name: "Elena Rostova, DPT",
        relationship: "Physical Therapist",
        assignedRole: "caregiver" as const,
        permissionTier: "caregiver_editor" as const,
        personalNote: "Welcome to Margaret's care circle.",
      };
      const res = inviteMemberSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("should reject invitation with invalid email address", () => {
      const payload = {
        patientId: "patient-profile-001",
        email: "not-an-email",
        name: "Elena Rostova",
        relationship: "Physical Therapist",
        assignedRole: "caregiver" as const,
        permissionTier: "caregiver_editor" as const,
      };
      const res = inviteMemberSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });

    it("should require at least 5 characters for role change reason", () => {
      const valid = updateMemberRoleSchema.safeParse({
        memberId: "member-sarah",
        newRole: "visiting_nurse",
        newTier: "full_admin",
        changeReason: "Promoted to lead care coordinator for medication management",
      });
      expect(valid.success).toBe(true);

      const invalid = updateMemberRoleSchema.safeParse({
        memberId: "member-sarah",
        newRole: "visiting_nurse",
        newTier: "full_admin",
        changeReason: "Test",
      });
      expect(invalid.success).toBe(false);
    });

    it("should require at least 5 characters for suspension and revocation reasons", () => {
      const validSuspension = suspendMemberSchema.safeParse({
        memberId: "member-sarah",
        suspensionReason: "Temporary medical leave of absence",
      });
      expect(validSuspension.success).toBe(true);

      const invalidSuspension = suspendMemberSchema.safeParse({
        memberId: "member-sarah",
        suspensionReason: "No",
      });
      expect(invalidSuspension.success).toBe(false);

      const validRevocation = revokeMemberSchema.safeParse({
        memberId: "member-sarah",
        revocationReason: "Contract concluded with Home Health Agency",
      });
      expect(validRevocation.success).toBe(true);

      const invalidRevocation = revokeMemberSchema.safeParse({
        memberId: "member-sarah",
        revocationReason: "done",
      });
      expect(invalidRevocation.success).toBe(false);
    });

    it("should validate care task creation payload", () => {
      const validTask = {
        patientId: "patient-profile-001",
        title: "Pick up Lisinopril 10mg refill",
        description: "Walgreens pharmacy on 5th Ave. Ready for pickup.",
        category: "medication_refill" as const,
        priority: "high" as const,
        dueDate: "2026-03-01",
      };
      const res = createCareTaskSchema.safeParse(validTask);
      expect(res.success).toBe(true);

      const invalidTask = {
        ...validTask,
        title: "No", // under 3 chars
      };
      const res2 = createCareTaskSchema.safeParse(invalidTask);
      expect(res2.success).toBe(false);
    });

    it("should require reason when reassigning a care task", () => {
      const valid = reassignTaskSchema.safeParse({
        assignedMemberId: "member-david",
        reassignReason: "Visiting nurse shift completed, transferred to family coordinator",
      });
      expect(valid.success).toBe(true);

      const invalid = reassignTaskSchema.safeParse({
        assignedMemberId: "member-david",
        reassignReason: "busy", // < 5 chars
      });
      expect(invalid.success).toBe(false);
    });

    it("should validate shift handover creation and clarification schemas", () => {
      const validHandover = {
        patientId: "patient-profile-001",
        outgoingMemberId: "member-sarah",
        incomingMemberId: "member-david",
        shiftPeriod: "Morning Nursing Shift",
        relevantResponsibilities: ["BP recorded", "Morning meds verified"],
        nonClinicalNotes: "Patient in cheerful mood, ate oatmeal breakfast.",
      };
      const res = createHandoverSchema.safeParse(validHandover);
      expect(res.success).toBe(true);

      const validClarification = clarificationHandoverSchema.safeParse({
        handoverId: "handover-001",
        question: "Did Margaret take her full glass of water with morning Metoprolol?",
      });
      expect(validClarification.success).toBe(true);

      const invalidClarification = clarificationHandoverSchema.safeParse({
        handoverId: "handover-001",
        question: "Why?", // < 5 chars
      });
      expect(invalidClarification.success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Care Circle Member Lifecycle & Immediate Revocation                     */
  /* -------------------------------------------------------------------------- */
  describe("Member Lifecycle & Access Revocation", () => {
    it("should provide baseline members with David Sullivan as emergency priority #1", () => {
      const members = getCachedMembers();
      expect(members.length).toBeGreaterThanOrEqual(4);

      const david = members.find((m) => m.id === "member-david");
      expect(david).toBeDefined();
      expect(david?.emergencyPriority).toBe(1);
      expect(david?.permissionTier).toBe("full_admin");
      expect(david?.membershipStatus).toBe("active");
      expect(david?.isActive).toBe(true);
    });

    it("should update member role and log role_changed activity with reason", () => {
      const testMemberId = "member-chen";
      const updated = updateMemberRole(
        testMemberId,
        "specialist_physician",
        "clinician_access",
        "Formalized geriatric attending physician credential verification",
        "David Sullivan",
        "Family Care Coordinator"
      );

      expect(updated).not.toBeNull();
      expect(updated?.permissionTier).toBe("clinician_access");

      const activities = getCachedActivities();
      const roleActivity = activities.find(
        (a) => a.eventType === "role_changed" && a.title.includes(updated!.name)
      );
      expect(roleActivity).toBeDefined();
      expect(roleActivity?.description).toContain("Formalized geriatric attending");
    });

    it("should suspend member access and mark isActive false", () => {
      const testMemberId = "member-mark";
      const suspended = suspendMember(
        testMemberId,
        "Temporary sabbatical overseas",
        "David Sullivan",
        "Family Care Coordinator"
      );

      expect(suspended).not.toBeNull();
      expect(suspended?.membershipStatus).toBe("suspended");
      expect(suspended?.isActive).toBe(false);
      expect(suspended?.suspendedAt).toBeDefined();

      const activities = getCachedActivities();
      const suspendActivity = activities.find(
        (a) => a.eventType === "member_suspended" && a.title.includes("Mark Sullivan")
      );
      expect(suspendActivity).toBeDefined();
    });

    it("should permanently revoke access immediately with recorded revocation reason", () => {
      const dummyId = `member-temp-${Date.now()}`;
      addMember({
        id: dummyId,
        patientId: "patient-profile-001",
        name: "Temporary Helper",
        email: "temp.helper@example.com",
        phone: "(555) 000-1111",
        relationship: "Temporary Aide",
        assignedRole: "caregiver",
        permissionTier: "caregiver_editor",
        isActive: true,
        membershipStatus: "active",
      });

      const revoked = revokeMember(
        dummyId,
        "Contract agency engagement completed on schedule",
        "David Sullivan",
        "Family Care Coordinator"
      );

      expect(revoked).not.toBeNull();
      expect(revoked?.membershipStatus).toBe("revoked");
      expect(revoked?.isActive).toBe(false);
      expect(revoked?.revokedAt).toBeDefined();
      expect(revoked?.revocationReason).toBe("Contract agency engagement completed on schedule");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Care Task Lifecycle & Delegation                                        */
  /* -------------------------------------------------------------------------- */
  describe("Care Task Coordination & Lifecycle", () => {
    it("should have baseline tasks covering refills and vitals", () => {
      const tasks = getCachedTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(4);

      const refillTask = tasks.find((t) => t.category === "medication_refill");
      expect(refillTask).toBeDefined();

      const vitalsTask = tasks.find((t) => t.category === "vitals_check");
      expect(vitalsTask).toBeDefined();
    });

    it("should create new care task and log task_assigned activity", () => {
      const taskId = `task-test-${Date.now()}`;
      addCareTask({
        id: taskId,
        patientId: "patient-profile-001",
        title: "Check refrigerator insulin storage temperature",
        description: "Ensure refrigerator thermometer reads between 36°F and 46°F.",
        category: "general_observation",
        priority: "medium",
        status: "assigned",
        assignedMemberId: "member-david",
        assignedMemberName: "David Sullivan",
        dueDate: "2026-03-05",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const tasks = getCachedTasks();
      const created = tasks.find((t) => t.id === taskId);
      expect(created).toBeDefined();
      expect(created?.title).toContain("insulin storage temperature");

      const activities = getCachedActivities();
      const activity = activities.find((a) => a.eventType === "task_assigned" && a.title.includes(taskId));
      expect(activity || activities[0].eventType === "task_assigned").toBeTruthy();
    });

    it("should update task status to completed and record completion notes", () => {
      const task = getCachedTasks()[0];
      const completed = updateCareTaskStatus(
        task.id,
        "completed",
        "Completed successfully per protocol",
        "David Sullivan"
      );

      expect(completed).not.toBeNull();
      expect(completed?.status).toBe("completed");
      expect(completed?.completionNotes).toBe("Completed successfully per protocol");
      expect(completed?.completedByName).toBe("David Sullivan");
      expect(completed?.completedAt).toBeDefined();
    });

    it("should reassign care task with mandatory justification reason", () => {
      const task = getCachedTasks().find((t) => t.status !== "completed") || getCachedTasks()[1];
      const reassigned = reassignCareTask(
        task.id,
        "member-sarah",
        "Sarah Jenkins, RN",
        "visiting_nurse",
        "Clinical skill required for proper observation",
        "David Sullivan"
      );

      expect(reassigned).not.toBeNull();
      expect(reassigned?.assignedMemberId).toBe("member-sarah");
      expect(reassigned?.assignedMemberName).toBe("Sarah Jenkins, RN");

      const activities = getCachedActivities();
      const reassignAct = activities.find((a) => a.description.includes("Clinical skill required"));
      expect(reassignAct).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Shift Handover Transitions                                              */
  /* -------------------------------------------------------------------------- */
  describe("Caregiver Shift Handover Transitions", () => {
    it("should provide baseline handover ready for acknowledgement", () => {
      const handovers = getCachedHandovers();
      expect(handovers.length).toBeGreaterThanOrEqual(1);

      const pending = handovers.find((h) => h.handoverStatus === "ready_for_handover");
      expect(pending).toBeDefined();
      expect(pending?.outgoingMemberName).toBe("Sarah Jenkins, RN");
      expect(pending?.incomingMemberName).toBe("David Sullivan");
    });

    it("should acknowledge handover and accept active care coordination", () => {
      const handover = getCachedHandovers().find((h) => h.handoverStatus === "ready_for_handover");
      expect(handover).toBeDefined();

      const acknowledged = acknowledgeHandover(
        handover!.id,
        "David Sullivan",
        "Reviewed morning BP vitals and agreed to administer evening doses"
      );

      expect(acknowledged).not.toBeNull();
      expect(acknowledged?.handoverStatus).toBe("acknowledged");
      expect(acknowledged?.acknowledgedByName).toBe("David Sullivan");
      expect(acknowledged?.acknowledgedAt).toBeDefined();

      const activities = getCachedActivities();
      const ackAct = activities.find((a) => a.eventType === "handover_acknowledged");
      expect(ackAct).toBeDefined();
    });

    it("should allow requesting clarification on a handover", () => {
      const newHandoverId = `handover-test-${Date.now()}`;
      addHandover({
        id: newHandoverId,
        patientId: "patient-profile-001",
        outgoingMemberId: "member-sarah",
        outgoingMemberName: "Sarah Jenkins, RN",
        outgoingMemberRole: "Visiting Nurse",
        incomingMemberId: "member-david",
        incomingMemberName: "David Sullivan",
        incomingMemberRole: "Family Care Coordinator",
        shiftPeriod: "Afternoon Shift",
        handoverDatetime: new Date().toISOString(),
        handoverStatus: "ready_for_handover",
        relevantResponsibilities: ["Checked blood glucose"],
        pendingTaskIds: [],
        nonClinicalNotes: "Blood glucose was 118 mg/dL.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const clarified = requestHandoverClarification(
        newHandoverId,
        "Was the reading taken fasting or post-prandial?",
        "David Sullivan"
      );

      expect(clarified).not.toBeNull();
      expect(clarified?.handoverStatus).toBe("needs_clarification");
      expect(clarified?.clarificationNotes).toBe("Was the reading taken fasting or post-prandial?");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. SQL Migration 5 Verification                                            */
  /* -------------------------------------------------------------------------- */
  describe("SQL Migration Verification", () => {
    it("should have migration 20260215000005_care_circle_collaboration.sql", () => {
      const migrationPath = path.join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260215000005_care_circle_collaboration.sql"
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, "utf-8");
      expect(sql).toContain("care_handovers");
      expect(sql).toContain("care_circle_activity");
      expect(sql).toContain("membership_status");
      expect(sql).toContain("revocation_reason");
      expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Frontend Routes File Existence                                          */
  /* -------------------------------------------------------------------------- */
  describe("Care Circle Frontend Routes", () => {
    const requiredRoutes = [
      "src/app/care-circle/page.tsx",
      "src/app/care-circle/members/page.tsx",
      "src/app/care-circle/members/[id]/page.tsx",
      "src/app/care-circle/invitations/page.tsx",
      "src/app/care-circle/tasks/page.tsx",
      "src/app/care-circle/tasks/[id]/page.tsx",
      "src/app/care-circle/handover/page.tsx",
      "src/app/care-circle/activity/page.tsx",
      "src/components/features/care-circle/care-circle-nav-tabs.tsx",
    ];

    it.each(requiredRoutes)("should exist: %s", (routePath) => {
      const fullPath = path.join(process.cwd(), routePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });
});