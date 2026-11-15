'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Heart, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || 'your registered email';

  const [resending, setResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<string | null>(null);

  const handleResend = () => {
    setResending(true);
    setResendStatus(null);
    setTimeout(() => {
      setResending(false);
      setResendStatus('A fresh verification link has been requested.');
    }, 1200);
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
          Verify your email address
        </h1>
        <p className="mt-2 text-sm text-secondaryText">
          We need to confirm your identity before connecting you to care circle records.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevated rounded-2xl border border-subtleBorder text-center">
          <div className="h-16 w-16 rounded-full bg-mint text-primary flex items-center justify-center mx-auto mb-5 border border-mint-border">
            <Mail className="h-8 w-8 stroke-[2]" />
          </div>

          <h2 className="text-lg font-bold text-main mb-2">Check your inbox</h2>
          <p className="text-xs text-secondaryText leading-relaxed mb-4">
            We have dispatched an email confirmation message to:
          </p>
          <div className="p-2.5 rounded-xl bg-canvas-background border border-subtleBorder text-xs font-semibold text-main break-all mb-5">
            {emailParam}
          </div>

          <p className="text-xs text-mutedText leading-relaxed mb-6">
            Click the link in the message to activate your account. If you do not see it in your inbox within 2 minutes, check your spam or promotions folder.
          </p>

          {resendStatus && (
            <div className="mb-4 p-3 rounded-xl bg-[#EAF4EE] border border-clinical-successBorder text-xs text-[#1B6346] flex items-center justify-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full h-11 rounded-xl border border-subtleBorder bg-canvas-background text-secondaryText hover:text-main hover:bg-canvas-subtle font-semibold text-xs transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin text-secondary' : ''}`} />
              <span>{resending ? 'Requesting link...' : 'Resend verification email'}</span>
            </button>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm transition-all touch-target-min"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Login</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-secondaryText flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-clinical-success" />
          <span>Email verification protects patient privacy and prevents unauthorized care circle access.</span>
        </div>
      </div>
    </div>
  );
}
