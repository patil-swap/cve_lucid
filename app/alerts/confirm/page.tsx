import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0a0a0f] border border-stone-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-stone-100 mb-4">You're All Set!</h1>
        <p className="text-stone-400 mb-8 leading-relaxed">
          Your subscription is confirmed. You will receive email alerts when new vulnerabilities matching your criteria are discovered.
        </p>
        <div className="space-y-4">
          <Link 
            href="/"
            className="block w-full py-3 bg-stone-900 border border-stone-800 text-stone-300 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors"
          >
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-center gap-2 text-[10px] text-stone-600 uppercase tracking-widest font-mono">
            <ShieldCheck className="w-3 h-3" />
            Verified Security Feed
          </div>
        </div>
      </div>
    </div>
  );
}
