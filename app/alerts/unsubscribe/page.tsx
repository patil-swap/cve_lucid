import Link from "next/link";
import { UserMinus } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0a0a0f] border border-stone-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <UserMinus className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-stone-100 mb-4">Unsubscribed</h1>
        <p className="text-stone-400 mb-8 leading-relaxed">
          You have been successfully removed from the alerts list. No further emails will be sent to your address.
        </p>
        <div className="space-y-4">
          <Link 
            href="/"
            className="block w-full py-3 bg-stone-900 border border-stone-800 text-stone-300 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
