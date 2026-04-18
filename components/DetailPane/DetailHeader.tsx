"use client";

import { CVESummary } from "@/types/cve";
import { SeverityBadge } from "../SeverityBadge";
import { ExternalLink, Share2, GitCompare, ShieldAlert, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

interface DetailHeaderProps {
  cve: CVESummary;
}

export function DetailHeader({ cve }: DetailHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = () => {
    const url = `${window.location.origin}/?cve=${cve.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-20 bg-[#05050a]/90 backdrop-blur-md border-b border-stone-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-mono font-bold text-stone-100 tracking-tight">{cve.id}</h2>
          <SeverityBadge severity={cve.severity} />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
           <div className="flex items-center gap-2 bg-stone-900/50 px-2 py-1 rounded border border-stone-800/80 group relative cursor-help">
              <span className="text-stone-600 uppercase tracking-tighter">CVSS</span>
              <span className="text-stone-300 font-bold">{cve.cvssScore?.toFixed(1) || "N/A"}</span>
              {/* Tooltip for Vector String */}
              <div className="absolute top-full left-0 mt-2 p-2 bg-stone-900 border border-stone-800 text-[9px] text-stone-400 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                 {cve.raw?.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString || 
                  cve.raw?.metrics?.cvssMetricV30?.[0]?.cvssData?.vectorString || 
                  "Vector String Unavailable"}
              </div>
           </div>
           <span>Published: {mounted ? new Date(cve.publishedDate).toLocaleDateString() : "--"}</span>
           <span>Last Modified: {mounted ? new Date(cve.lastModifiedDate).toLocaleDateString() : "--"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <Button 
           variant="ghost" 
           size="sm" 
           onClick={() => {
             const el = document.getElementById("impact-simulation");
             el?.scrollIntoView({ behavior: "smooth" });
           }}
           className="h-9 gap-2 text-stone-500 hover:text-rose-400 hover:bg-rose-500/5"
         >
           <Zap className="w-4 h-4" />
           <span className="text-[10px] uppercase font-bold tracking-widest hidden lg:inline">Simulate Impact</span>
         </Button>

         <Button 
           variant="outline" 
           size="sm" 
           onClick={handleShare}
           className={`h-9 gap-2 border-stone-800 bg-[#0e0e16] transition-all ${
             copied ? "text-emerald-400 border-emerald-900 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]" : "text-stone-400 hover:text-emerald-400 hover:border-emerald-900"
           }`}
         >
           {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
           <span className="text-[10px] uppercase font-bold tracking-widest hidden lg:inline">
             {copied ? "Copied!" : "Share"}
           </span>
         </Button>

         <a 
           href={`https://nvd.nist.gov/vuln/detail/${cve.id}`} 
           target="_blank" 
           rel="noopener noreferrer"
           className="p-2.5 rounded-md border border-stone-800 bg-stone-900/50 text-stone-500 hover:text-stone-100 hover:bg-stone-800 transition-all"
         >
           <ExternalLink className="w-4 h-4" />
         </a>
      </div>
    </header>
  );
}
