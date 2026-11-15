import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-elder">
        <div className="h-16 w-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="h-8 w-8 stroke-[2]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Record Not Found</h2>
        <p className="text-slate-600 mb-6 text-sm">
          The requested healthcare page or record could not be located.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 text-white font-medium hover:bg-navy-800 transition-colors text-base"
        >
          <ArrowLeft className="h-5 w-5" />
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
