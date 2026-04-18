"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";

interface AlertPopoverProps {
  defaultProduct: string | null;
}

export function AlertPopover({ defaultProduct }: AlertPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState(defaultProduct || "");
  const [severity, setSeverity] = useState("HIGH");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product, severityThreshold: severity }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Subscription failed.");
      } else {
        setStatus("success");
        setMessage("Check your inbox to confirm your subscription.");
        setEmail("");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Connection error. Try again later.");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 gap-2 transition-all ${
          isOpen ? "text-sky-400 bg-sky-500/5 border border-sky-500/20" : "text-stone-500 hover:text-sky-400 hover:bg-sky-500/5"
        }`}
      >
        <Bell className="w-4 h-4" />
        <span className="text-[10px] uppercase font-bold tracking-widest hidden lg:inline">Alert Me</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-x-4 top-[15%] md:absolute md:top-full md:right-0 md:inset-x-auto md:mt-2 w-auto md:w-80 bg-[#0a0a0f] border border-stone-800 rounded-xl shadow-2xl p-6 z-[60] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-300">Set Security Alert</h4>
            <button onClick={() => setIsOpen(false)} className="text-stone-600 hover:text-stone-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {status === "success" ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs text-stone-300 leading-relaxed">{message}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="w-full h-8 text-[10px] font-bold uppercase tracking-widest border-stone-800 bg-stone-900"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold text-stone-600 tracking-widest">Email Address</label>
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold text-stone-600 tracking-widest">Product Filter</label>
                <input 
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="All products"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold text-stone-600 tracking-widest">Minimum Severity</label>
                <div className="flex flex-wrap gap-1.5">
                  {["CRITICAL", "HIGH", "MEDIUM", "ALL"].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${
                        severity === sev 
                          ? "bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-[0_0_10px_-3px_rgba(56,189,248,0.2)]" 
                          : "bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 p-2 bg-rose-500/5 border border-rose-500/20 rounded text-[10px] text-rose-400">
                  <ShieldAlert className="w-3 h-3" />
                  {message}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={status === "loading"}
                className="w-full h-10 bg-sky-600 hover:bg-sky-500 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-sky-900/10 disabled:opacity-50"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe Now"}
              </Button>

              <p className="text-[8px] text-center text-stone-600 italic leading-relaxed">
                We'll email you when new CVEs match these criteria. No account required. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
