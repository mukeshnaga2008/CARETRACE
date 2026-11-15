/**
 * CARETRACE Care Passport PDF Export Service
 * PromptWars × Catalyst 2026: Phase 13
 * 
 * Uses jsPDF to compile a high-contrast, professional, print-friendly
 * clinical summary for emergency handoffs and doctor visits.
 */

import jsPDF from "jspdf";

export interface PassportPDFInput {
  patient: {
    fullName: string;
    preferredName: string;
    dateOfBirth: string;
    age: number;
    bloodType: string;
    primaryDoctor: string;
    primaryClinic: string;
    preferredLanguage: string;
  };
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isHealthcareProxy: boolean;
  }>;
  conditionsAndAllergies: {
    conditions: Array<{ name: string; diagnosedYear: string; status: string }>;
    allergies: Array<{ allergen: string; severity: string; reaction: string }>;
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    scheduledTimes?: string[];
    prescribingDoctor?: string;
    verificationStatus?: string;
  }>;
  upcomingAppointments: Array<{
    title: string;
    provider: string;
    clinic: string;
    date: string;
  }>;
  careInstructions: Array<{
    title: string;
    directives: string[];
    version: string;
  }>;
  advanceDirectives: {
    polstOnFile: boolean;
    dnrStatus: string;
    medicalPowerOfAttorney: string;
  };
  meta: {
    generatedAt: string;
    verificationHash: string;
    dataFreshnessNotice: string;
    includedSections: string[];
  };
}

export function generateCarePassportPDF(data: PassportPDFInput): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 (Deep Navy)
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CARETRACE — AUTHORISED CARE PASSPORT", 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Intelligent Healthcare Continuity Network • Emergency & Specialist Handoff Summary", 14, 20);

  y = 36;

  // 2. Patient Identity Box
  doc.setTextColor(15, 23, 42);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.patient.fullName, 18, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Preferred Name: "${data.patient.preferredName}" • DOB: ${data.patient.dateOfBirth} (${data.patient.age}y) • Blood Group: ${data.patient.bloodType}`,
    18,
    y + 15
  );
  doc.text(
    `Primary Physician: ${data.patient.primaryDoctor} • Facility: ${data.patient.primaryClinic} • Language: ${data.patient.preferredLanguage}`,
    18,
    y + 21
  );

  y += 33;

  // 3. Verification & Advance Directives Bar
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(204, 251, 241);
  doc.roundedRect(14, y, pageWidth - 28, 14, 1.5, 1.5, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(15, 118, 110); // teal-700
  doc.setFont("helvetica", "bold");
  doc.text(`VERIFICATION STAMP: ${data.meta.verificationHash}`, 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Advance Directives: ${data.advanceDirectives.dnrStatus} • POA: ${data.advanceDirectives.medicalPowerOfAttorney}`,
    18,
    y + 11
  );

  y += 20;

  // Helper section title
  const renderSectionHeader = (title: string) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(14, y, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 20, y + 5);
    y += 9;
  };

  // 4. Emergency Contacts & Healthcare Proxy
  if (data.meta.includedSections.includes("emergency_contacts")) {
    renderSectionHeader("EMERGENCY CONTACTS & HEALTHCARE PROXY");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    data.emergencyContacts.forEach((c) => {
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text(`${c.name} (${c.relationship})`, 18, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Tel: ${c.phone} ${c.isHealthcareProxy ? "• [AUTHORISED HEALTHCARE PROXY]" : ""}`, 95, y);
      y += 5.5;
    });
    y += 3;
  }

  // 5. Conditions & Known Allergies
  if (data.meta.includedSections.includes("conditions_and_allergies")) {
    renderSectionHeader("ACTIVE CHRONIC CONDITIONS & KNOWN ALLERGIES");
    doc.setFontSize(8.5);

    // Conditions
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Clinical Diagnoses:", 18, y);
    y += 4.5;
    data.conditionsAndAllergies.conditions.forEach((cond) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${cond.name} (Diagnosed ${cond.diagnosedYear}) — Status: ${cond.status}`, 22, y);
      y += 5;
    });

    y += 2;

    // Allergies
    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text("Documented Allergies & Adverse Reactions:", 18, y);
    y += 4.5;
    data.conditionsAndAllergies.allergies.forEach((alg) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`• ${alg.allergen} — Severity: ${alg.severity} (Reaction: ${alg.reaction})`, 22, y);
      y += 5;
    });

    y += 3;
  }

  // 6. Current Verified Medication Regimen
  if (data.meta.includedSections.includes("medication_regimen")) {
    renderSectionHeader("CURRENT ACTIVE MEDICATION REGIMEN");
    doc.setFontSize(8.5);
    data.medications.forEach((med) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${med.name} (${med.dosage})`, 18, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const times = med.scheduledTimes ? `Times: ${med.scheduledTimes.join(", ")}` : "";
      doc.text(`${med.frequency} • ${times} • Prescriber: ${med.prescribingDoctor || "Attending MD"}`, 85, y);
      y += 5.5;
    });
    y += 3;
  }

  // 7. Core Clinical Care Directives
  if (data.meta.includedSections.includes("care_instructions") && data.careInstructions.length > 0) {
    renderSectionHeader("CLINICIAN DIRECTIVES & WITHHOLDING PARAMETERS");
    doc.setFontSize(8.5);
    data.careInstructions.forEach((inst) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${inst.title} (${inst.version})`, 18, y);
      y += 4.5;
      inst.directives.forEach((d) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`  - ${d}`, 22, y);
        y += 4.5;
      });
      y += 1.5;
    });
    y += 2;
  }

  // 8. Upcoming Appointments
  if (data.meta.includedSections.includes("upcoming_appointments") && data.upcomingAppointments.length > 0) {
    renderSectionHeader("UPCOMING SCHEDULED CLINICAL CONSULTATIONS");
    doc.setFontSize(8.5);
    data.upcomingAppointments.forEach((a) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${a.title} with ${a.provider}`, 18, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${new Date(a.date).toLocaleDateString()} • Location: ${a.clinic}`, 110, y);
      y += 5.5;
    });
    y += 3;
  }

  // 9. Document Footer & Timestamp
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `CONFIDENTIAL MEDICAL SUMMARY • Generated: ${new Date(data.meta.generatedAt).toLocaleString()} • Verified Snapshot Hash: ${data.meta.verificationHash}`,
    14,
    pageHeight - 10
  );
  doc.text(
    "CARETRACE is an authorized care coordination system. Confirm active medical orders with treating clinician before acute therapy.",
    14,
    pageHeight - 6
  );

  return doc;
}
