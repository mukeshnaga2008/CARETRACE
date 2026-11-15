'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error telemetry without exposing PHI
    console.error('CARETRACE UI Boundary Caught Error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border-2 border-red-200 p-8 shadow-elder text-center">
        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Something needs attention</h2>
        <p className="text-slate-600 mb-6 text-sm">
          We encountered an unexpected issue while loading this healthcare screen. Your saved records are secure.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 text-white font-medium hover:bg-navy-800 transition-colors focus:ring-4 focus:ring-teal-500 text-base"
        >
          <RefreshCw className="h-5 w-5" />
          Try Reloading View
        </button>
      </div>
    </div>
  );
}
