import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center animate-spin mb-4">
        <Activity className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">Loading Care Network...</h3>
      <p className="text-slate-500 text-sm mt-1">Retrieving verified healthcare continuity data</p>
    </div>
  );
}
