'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShieldCheck } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function RootEntryPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Always navigate to /login first as requested
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-canvas-background flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex flex-col items-center max-w-sm animate-in fade-in duration-300">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl">
            <Heart className="h-8 w-8 stroke-[2.5] animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-mint border-2 border-white dark:border-slate-900 flex items-center justify-center text-primary">
            <ShieldCheck className="h-3 w-3" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-main mb-1">
          {APP_NAME}
        </h1>
        <p className="text-xs text-secondaryText tracking-wide mb-6">
          {APP_TAGLINE}
        </p>

        <div className="flex items-center gap-2 text-xs text-secondaryText bg-card-background border border-subtleBorder px-4 py-2 rounded-full shadow-sm">
          <div className="h-2 w-2 rounded-full bg-secondary animate-ping" />
          <span>Directing to Care Portal Sign In...</span>
        </div>
      </div>
    </div>
  );
}
