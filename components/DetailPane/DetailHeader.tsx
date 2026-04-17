"use client";

import { CVESummary } from "@/types/cve";
import { SeverityBadge } from "../SeverityBadge";
import { ExternalLink, Share2, GitCompare, ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

interface DetailHeaderProps {
  cve: CVESummary;
}

export function DetailHeader({ cve }: DetailHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = () => {
    const url = `${window.location.origin}/?cve=${cve.id}`;
    navigator.clipboard.writeText(url);
    // Add toast or feedback here in a real app
    alert("Shareable link copied to clipboard!");
  };

  return (
    <header className="sticky top-0 z-20 bg-[#05050a]/90 backdrop-blur-md border-b border-stone-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-mono font-bold text-stone-100 tracking-tight">{cve.id}</h2>
          <SeverityBadge severity={cve.severity} />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
           <div className="flex items-center gap-1.5 bg-stone-900/50 px-2 py-1 rounded border border-stone-800/80">
              <span className="text-stone-600 uppercase tracking-tighter">CVSS</span>
              <span className="text-stone-300 font-bold">{cve.cvssScore?.toFixed(1) || "N/A"}</span>
           </div>
           <span>Published: {mounted ? new Date(cve.publishedDate).toLocaleDateString() : "--"}</span>
           <span>Last Modified: {mounted ? new Date(cve.lastModifiedDate).toLocaleDateString() : "--"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <Button 
           variant="outline" 
           size="sm" 
           onClick={handleShare}
           className="h-9 gap-2 border-stone-800 bg-[#0e0e16] text-stone-400 hover:text-emerald-400 hover:border-emerald-900"
         >
           <Share2 className="w-4 h-4" />
           <span className="text-[10px] uppercase font-bold tracking-widest hidden lg:inline">Share</span>
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
