'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Heart, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  UserCheck 
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE, AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { isSafeRedirect } from '@/lib/auth/permissions';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const targetRedirect = isSafeRedirect(redirectTo) ? redirectTo! : '/dashboard';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isDemoLoading, setIsDemoLoading] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || data.message || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Authentication verified. Redirecting to your care network...');
      setTimeout(() => {
        router.push(targetRedirect);
        router.refresh();
      }, 700);
    } catch {
      setErrorMessage('Network connection error. Please verify your connection.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: AppRole) => {
    setIsDemoLoading(role);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        setErrorMessage('Demo login is unavailable.');
        setIsDemoLoading(null);
        return;
      }

      setSuccessMessage(`Entering evaluation mode as ${USER_PERSPECTIVES[role].sampleName} (${USER_PERSPECTIVES[role].label})...`);
      setTimeout(() => {
        router.push(targetRedirect);
        router.refresh();
      }, 500);
    } catch {
      setErrorMessage('Failed to establish demo session.');
      setIsDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-secondary rounded-xl p-1">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Heart className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
              {APP_NAME}
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-mint text-primary border border-mint-border">
                Healthcare Continuity
              </span>
            </span>
            <span className="block text-xs text-secondaryText tracking-wide">
              {APP_TAGLINE}
            </span>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-main">
          Sign in to your care portal
        </h1>
        <p className="mt-2 text-sm text-secondaryText">
          Connecting elderly patients, family members, and authorized caregivers.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevated rounded-2xl border border-subtleBorder">
          {/* Notification Alerts */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-clinical-dangerBg border border-clinical-dangerBorder flex items-start gap-3 text-sm text-[#852D2D] animate-in fade-in duration-200" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5 text-xs">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#EAF4EE] border border-clinical-successBorder flex items-start gap-3 text-sm text-[#1B6346] animate-in fade-in duration-200" role="status">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="mt-0.5 text-xs">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Quick Credential Fill Pill Strip for Synthetic Demo Dataset */}
          <div className="mb-5 p-3 rounded-xl bg-canvas-background border border-subtleBorder text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-secondaryText">
                Synthetic Demo Patients (Click to select & fill)
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-mint text-primary">
                Dataset Ready
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Margaret Sullivan', patientId: 'DEMO-001', role: 'David (Son)', email: 'david@caretrace.health' },
                { name: 'Arthur Bennett', patientId: 'DEMO-002', role: 'Helen (Daughter)', email: 'helen@caretrace.health' },
                { name: 'Leela Raman', patientId: 'DEMO-003', role: 'Kavitha (Daughter)', email: 'kavitha@caretrace.health' },
                { name: 'Josephine Carter', patientId: 'DEMO-004', role: 'Michael (Son)', email: 'michael@caretrace.health' },
                { name: 'Ravi Narayanan', patientId: 'DEMO-005', role: 'Meena (Daughter)', email: 'meena@caretrace.health' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Caretrace2026!');
                    setErrorMessage(null);
                    try {
                      document.cookie = `caretrace_active_patient=${acc.patientId}; path=/; max-age=604800`;
                      localStorage.setItem('caretrace_active_patient', acc.patientId);
                    } catch {
                      // fallback
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-subtleBorder hover:border-secondary hover:text-primary transition-all text-main flex items-center gap-1.5 shadow-2xs group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary group-hover:scale-125 transition-transform" />
                  <span className="font-bold">{acc.name}</span>
                  <span className="text-[10px] text-secondaryText">({acc.role})</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-mutedText">
              Clicking a patient configures the session to load <strong>their specific records</strong> on the dashboard. Password: <code className="font-mono text-primary font-bold">Caretrace2026!</code>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-main mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-main">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondaryText hover:text-main focus-visible:ring-2 focus-visible:ring-secondary rounded p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-subtleBorder text-secondary focus:ring-secondary"
              />
              <label htmlFor="remember-me" className="ml-2.5 block text-xs text-secondaryText select-none">
                Remember session on this trusted device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || Boolean(isDemoLoading)}
              className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 touch-target-min"
            >
              {isLoading ? (
                <span>Authenticating with Supabase...</span>
              ) : (
                <>
                  <span>Sign in to Care Network</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 text-center text-xs text-secondaryText">
            Don't have an authorized account yet?{' '}
            <Link
              href="/register"
              className="font-bold text-secondary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary rounded"
            >
              Register here
            </Link>
          </div>

          {/* Evaluation / Demonstration Presets */}
          <div className="mt-8 pt-6 border-t border-subtleBorder">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondaryText flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                PromptWars 2026 Evaluation Presets
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-mint text-primary border border-mint-border">
                Demo Ready
              </span>
            </div>
            <p className="text-xs text-mutedText mb-3">
              Reviewers and judges may instantly enter the application using one of the representative stakeholder profiles:
            </p>

            <div className="space-y-2">
              {(['patient', 'family', 'caregiver'] as AppRole[]).map((r) => {
                const perspective = USER_PERSPECTIVES[r];
                const isThisLoading = isDemoLoading === r;

                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleDemoLogin(r)}
                    disabled={isLoading || Boolean(isDemoLoading)}
                    className="w-full p-2.5 rounded-xl border border-subtleBorder bg-canvas-background hover:bg-mint hover:border-mint-border text-left transition-all flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {perspective.sampleName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-main">{perspective.sampleName}</div>
                        <div className="text-[11px] text-secondaryText">{perspective.label} — {perspective.roleDescription}</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-semibold text-secondary flex items-center gap-1">
                      {isThisLoading ? 'Entering...' : 'Evaluate'}
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[10px] text-mutedText text-center">
              Evaluation sessions run on verified synthetic patient records for Margaret Sullivan (78y).
            </p>
          </div>
        </div>

        {/* Security & Regulatory Notice */}
        <div className="mt-6 text-center text-xs text-secondaryText flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-clinical-success" />
          <span>Care instructions and personal health records protected by CARETRACE RLS.</span>
        </div>
      </div>
    </div>
  );
}
