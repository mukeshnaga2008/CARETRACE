'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { PassportNavTabs } from '@/components/features/passport/passport-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Eye,
  Sliders,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  getCarePassportData,
  getCarePassportPreferences,
  getCachedPassportExports,
  recordPassportExport,
} from '@/lib/data/timeline-analytics-data';
import { generateCarePassportPDF } from '@/lib/services/passport-pdf-service';

export default function CarePassportOverviewPage() {
  const [data, setData] = React.useState<any>(null);
  const [recentExport, setRecentExport] = React.useState<any>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    let activeId = 'DEMO-001';
    try {
      const match = document.cookie.match(/caretrace_active_patient=([^;]+)/);
      const saved = match ? match[1] : localStorage.getItem('caretrace_active_patient');
      if (saved) activeId = saved;
    } catch {
      // fallback
    }
    const config = getCarePassportPreferences();
    const passportData = getCarePassportData(activeId, config);
    setData(passportData);

    const exports = getCachedPassportExports();
    if (exports.length > 0) {
      setRecentExport(exports[0]);
    }
  }, []);

  const handleExportPDF = () => {
    if (!data) return;
    setIsExporting(true);
    setExportNotice(null);

    setTimeout(() => {
      // 1. Generate jsPDF document
      const doc = generateCarePassportPDF(data);

      // 2. Trigger browser download
      doc.save(`CARETRACE_Passport_${data.patient.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      // 3. Record audit trail entry
      const rec = recordPassportExport(
        'patient-profile-001',
        'family',
        'David Sullivan',
        'Family Member (Proxy)',
        data.meta.includedSections,
        data.meta.verificationHash,
        'Direct PDF download from Care Passport Overview'
      );
      setRecentExport(rec);
      setIsExporting(false);
      setExportNotice(`Care Passport PDF successfully generated & downloaded. Hash: ${rec.verificationHash}`);
      setTimeout(() => setExportNotice(null), 6000);
    }, 500);
  };

  if (!data) return null;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Passport', href: '/care-passport' }, { label: 'Overview' }]}
      pageTitle="Authorised Care Passport"
      pageDescription="Cryptographically verified emergency handoff document summarizing verified medications, allergies, conditions, and healthcare proxy authorization."
    >
      <PageContainer>
        <PassportNavTabs />

        {exportNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Security & Verification Banner */}
        <div className="mb-6 p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span className="font-bold text-base text-white">Authorised Clinical Handoff Document</span>
                <Badge variant="outline" className="text-[10px] bg-teal-950 text-teal-300 border-teal-700">
                  Live Snapshot
                </Badge>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Patient: <strong className="text-white">{data.patient.fullName}</strong> ({data.patient.age}y, Blood Group: {data.patient.bloodType}).
                Active Verification Hash: <code className="text-teal-300 font-mono">{data.meta.verificationHash}</code>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/care-passport/preview">
                <Button variant="outline" size="sm" className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 min-h-[44px]">
                  <Eye className="w-4 h-4 mr-1.5" />
                  Preview Document
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white min-h-[44px] font-semibold"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {isExporting ? 'Generating PDF...' : 'Export Verified PDF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Core Passport Content Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-[var(--main-text)]">
                Health Identity & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-[var(--secondary-text)] block">Active Diagnoses</span>
                <span className="font-semibold text-slate-800">
                  {data.conditionsAndAllergies.conditions.map((c: any) => c.name).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-[var(--secondary-text)] block">Documented Allergies</span>
                <span className="font-semibold text-rose-700">
                  {data.conditionsAndAllergies.allergies.map((a: any) => a.allergen).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-[var(--secondary-text)] block">Advance Directives</span>
                <span className="font-semibold text-slate-800">
                  {data.advanceDirectives.dnrStatus}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-[var(--main-text)]">
                Medications & Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-[var(--secondary-text)] block">Active Prescriptions</span>
                <span className="font-semibold text-teal-800">
                  {data.medications.length} verified medications
                </span>
              </div>
              <div>
                <span className="text-[var(--secondary-text)] block">Clinical Directives</span>
                <span className="font-semibold text-slate-800">
                  {data.careInstructions.length} protocol directives (withholding thresholds on file)
                </span>
              </div>
              <div>
                <span className="text-[var(--secondary-text)] block">Upcoming Consultations</span>
                <span className="font-semibold text-blue-700">
                  {data.upcomingAppointments.length} scheduled visits
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-[var(--main-text)]">
                Audit & Export Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              {recentExport ? (
                <>
                  <div>
                    <span className="text-[var(--secondary-text)] block">Last Generated</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(recentExport.exportedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--secondary-text)] block">Exported By</span>
                    <span className="font-semibold text-slate-800">
                      {recentExport.exportedByName} ({recentExport.exportedByRole})
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--secondary-text)] block">Audit Verification Hash</span>
                    <span className="font-mono text-[11px] text-slate-600 break-all">
                      {recentExport.verificationHash}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No previous exports recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/care-passport/preview" className="block">
            <Card className="p-4 border-slate-200 hover:border-teal-400 transition-all cursor-pointer h-full">
              <Eye className="w-5 h-5 text-teal-700 mb-2" />
              <h4 className="font-bold text-sm text-[var(--main-text)]">Document Preview</h4>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Inspect print-ready clinical formatting before physical or digital handoff.
              </p>
            </Card>
          </Link>

          <Link href="/care-passport/settings" className="block">
            <Card className="p-4 border-slate-200 hover:border-teal-400 transition-all cursor-pointer h-full">
              <Sliders className="w-5 h-5 text-indigo-700 mb-2" />
              <h4 className="font-bold text-sm text-[var(--main-text)]">Configure Included Sections</h4>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Select which clinical sections and privacy elements are included in exports.
              </p>
            </Card>
          </Link>

          <Link href="/care-passport/history" className="block">
            <Card className="p-4 border-slate-200 hover:border-teal-400 transition-all cursor-pointer h-full">
              <History className="w-5 h-5 text-amber-700 mb-2" />
              <h4 className="font-bold text-sm text-[var(--main-text)]">Export Audit Ledger</h4>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Inspect tamper-evident export logs and verification stamps.
              </p>
            </Card>
          </Link>
        </div>
      </PageContainer>
    </AppShell>
  );
}
