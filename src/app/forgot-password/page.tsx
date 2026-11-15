'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Mail, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Whether email exists or not, we transition to neutral submitted state
      setIsSubmitted(true);
    } catch {
      // In case of network failure
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-secondary rounded-xl p-1">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Heart className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
              {APP_NAME}
            </span>
            <span className="block text-xs text-secondaryText tracking-wide">
              {APP_TAGLINE}
            </span>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-main">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-secondaryText">
          Enter your registered email address to receive secure recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevated rounded-2xl border border-subtleBorder">
          {isSubmitted ? (
            <div className="text-center py-4 animate-in fade-in duration-300">
              <div className="h-12 w-12 rounded-full bg-[#EAF4EE] text-clinical-success flex items-center justify-center mx-auto mb-4 border border-clinical-successBorder">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-main mb-2">Check your email</h2>
              <p className="text-xs text-secondaryText leading-relaxed mb-6">
                If an authorized account is registered with <strong className="text-main">{email}</strong>, a secure password reset link has been dispatched.
              </p>
              <div className="p-3.5 rounded-xl bg-canvas-background border border-subtleBorder text-[11px] text-mutedText text-left mb-6">
                <p className="font-semibold text-secondaryText mb-1">Healthcare Security Notice:</p>
                To prevent account enumeration and protect patient privacy, CARETRACE will never publicly reveal whether an email address is registered.
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-clinical-dangerBg border border-clinical-dangerBorder flex items-start gap-3 text-sm text-[#852D2D]" role="alert">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Notice</p>
                    <p className="mt-0.5 text-xs">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-main mb-1.5">
                  Account email address
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 touch-target-min"
              >
                {isLoading ? (
                  <span>Sending instructions...</span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-secondary rounded p-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-secondaryText flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-clinical-success" />
          <span>Encrypted token recovery links expire automatically after 1 hour.</span>
        </div>
      </div>
    </div>
  );
}
