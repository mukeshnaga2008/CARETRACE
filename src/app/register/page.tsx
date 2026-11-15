'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role, setRole] = React.useState<'patient' | 'family' | 'caregiver'>('patient');
  const [acceptTerms, setAcceptTerms] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptTerms) {
      setErrorMessage('You must accept the Terms of Service and Healthcare Privacy Notice to proceed.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please ensure your password satisfies all security criteria below.');
      return;
    }

    if (!doPasswordsMatch) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword,
          role,
          acceptTerms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create account. Please verify your details.');
        setIsLoading(false);
        return;
      }

      if (data.requiresEmailVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setSuccessMessage('Account established successfully. Redirecting to your care portal...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      }
    } catch {
      setErrorMessage('A connection error occurred while contacting the authentication service.');
      setIsLoading(false);
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
          Create an Authorized Care Account
        </h1>
        <p className="mt-2 text-sm text-secondaryText">
          Establish your identity in the CARETRACE healthcare coordination network.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevated rounded-2xl border border-subtleBorder">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-clinical-dangerBg border border-clinical-dangerBorder flex items-start gap-3 text-sm text-[#852D2D] animate-in fade-in duration-200" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Issue</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-main mb-1.5">
                Full legal name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Margaret Sullivan"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-main mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Care Role Designation */}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-main mb-1.5">
                Primary care role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
              >
                <option value="patient">Elder Patient — Personal health management</option>
                <option value="family">Family Member — Family care circle coordination</option>
                <option value="caregiver">Professional Caregiver — Visiting nurse or aide</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-main mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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

              {/* Password criteria checklist */}
              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-secondaryText">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-clinical-success font-semibold' : ''}`}>
                  <span>{hasMinLength ? '✓' : '•'}</span> 8+ characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-clinical-success font-semibold' : ''}`}>
                  <span>{hasUppercase ? '✓' : '•'}</span> Uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-clinical-success font-semibold' : ''}`}>
                  <span>{hasLowercase ? '✓' : '•'}</span> Lowercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-clinical-success font-semibold' : ''}`}>
                  <span>{hasNumber ? '✓' : '•'}</span> Number (0-9)
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-main mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondaryText hover:text-main focus-visible:ring-2 focus-visible:ring-secondary rounded p-0.5"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`mt-1 text-xs ${doPasswordsMatch ? 'text-clinical-success font-semibold' : 'text-clinical-danger font-semibold'}`}>
                  {doPasswordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="pt-2">
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-subtleBorder text-secondary focus:ring-secondary"
                />
                <label htmlFor="acceptTerms" className="ml-2.5 block text-xs text-secondaryText leading-relaxed">
                  I agree to the <Link href="/privacy" className="font-semibold text-secondary hover:underline">CARETRACE Terms of Service</Link> and acknowledge the <Link href="/privacy" className="font-semibold text-secondary hover:underline">Healthcare Privacy Notice</Link>. We do not collect non-essential sensitive health data during account creation.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !acceptTerms || !isPasswordValid || !doPasswordsMatch}
              className="w-full h-11 mt-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 touch-target-min"
            >
              {isLoading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-secondaryText">
            Already have an authorized account?{' '}
            <Link
              href="/login"
              className="font-bold text-secondary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary rounded"
            >
              Sign in here
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-secondaryText flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-clinical-success" />
          <span>Patient-centered healthcare privacy controls and audit logging standard.</span>
        </div>
      </div>
    </div>
  );
}
