"use client";

import { useState } from "react";
import { CVESummary, severityColorMap } from "@/types/cve";
import { WhatIfExplainer } from "../WhatIfExplainer";
import { ImpactSimulation } from "../ImpactSimulation";
import { SimilarCVEs } from "./SimilarCVEs";
import { VersionChecker } from "./VersionChecker";
import { Button } from "../ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Bug, 
  CheckCircle2, 
  ShieldAlert, 
  FlaskConical, 
  Info,
  Clock,
  Layers
} from "lucide-react";

interface CVEDetailProps {
  cve: CVESummary;
  aiData: any;
}

export function CVEDetail({ cve, aiData }: CVEDetailProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(["analogy", "readingTime", "rawData"]));

  const toggleSection = (id: string) => {
    const next = new Set(collapsedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsedSections(next);
  };

  const isCollapsed = (id: string) => collapsedSections.has(id);

  const severityAccent = severityColorMap[cve.severity] || "border-l-stone-800";
  // Extract hex-ish color name from tailwind class if possible, or fallback
  const accentColor = cve.severity === "CRITICAL" ? "text-rose-500" : 
                     cve.severity === "HIGH" ? "text-orange-500" :
                     "text-sky-500";

  return (
    <div className="max-w-2xl mx-auto px-6 py-4 w-full space-y-12 pb-32">
      
      {/* STATUS CHIPS */}
      <div className="flex flex-wrap gap-3">
        {cve.isZeroDay === 1 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            <Bug className="w-3 h-3 text-red-500" />
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Zero-Day</span>
          </div>
        )}
        {cve.patchAvailable === 1 ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Patched</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Unpatched</span>
          </div>
        )}
      </div>

      {/* TIER 1 - PRIMARY */}
      <div className="space-y-10">
        <section className={`pl-6 border-l-2 ${severityAccent.replace('border-l-', 'border-')} border-opacity-40 mb-8`}>
          <h4 className={`text-[10px] font-semibold uppercase tracking-[0.3em] mb-4 ${accentColor}`}>Technical Reality</h4>
          <p className="text-[#f8f8ff] text-base leading-relaxed selection:bg-sky-500/30">
            {aiData.technicalReality}
          </p>
        </section>

        <section className={`pl-6 border-l-2 ${severityAccent.replace('border-l-', 'border-')} border-opacity-40 mb-8`}>
          <h4 className={`text-[10px] font-semibold uppercase tracking-[0.3em] mb-4 ${accentColor}`}>How to Fix</h4>
          <div className="text-[#f8f8ff] text-base leading-relaxed whitespace-pre-line selection:bg-violet-500/30">
            {aiData.howToFix}
          </div>
        </section>
      </div>

      <div className="border-t border-white/5" />

      {/* TIER 2 - SECONDARY */}
      <div className="space-y-8">
        {cve.affectedVersionRanges && cve.affectedVersionRanges.length > 0 && (
          <VersionChecker versionRanges={cve.affectedVersionRanges} />
        )}

        <section className="mb-6">
          <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-[#6b7280] mb-3">Plain English Version</h4>
          <p className="text-[#a0a0b0] text-sm leading-relaxed max-w-xl">
            {aiData.plainEnglish}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-[#0a0a0f]/50 rounded-xl border border-stone-800/30">
             <WhatIfExplainer cve={cve} />
          </div>
          <div className="bg-[#0a0a0f]/50 rounded-xl border border-stone-800/30">
             <ImpactSimulation cve={cve} />
          </div>
        </div>

        <div className="mb-6">
          <SimilarCVEs cveId={cve.id} />
        </div>
      </div>

      <div className="border-t border-white/5" />

      {/* TIER 3 - TERTIARY */}
      <div className="space-y-3">
        {/* Analogy */}
        <div className="border border-stone-800/20 rounded-lg overflow-hidden transition-all">
          <button 
            onClick={() => toggleSection('analogy')}
            className="w-full flex items-center justify-between p-3 bg-stone-900/10 hover:bg-stone-900/30 transition-colors"
          >
            <span className="text-xs text-[#4b5563] uppercase tracking-widest font-bold">The Analogy</span>
            {isCollapsed('analogy') ? <ChevronDown className="w-3 h-3 text-stone-600" /> : <ChevronUp className="w-3 h-3 text-stone-600" />}
          </button>
          {!isCollapsed('analogy') && (
            <div className="p-4 bg-[#0a0a0f]/30 animate-in slide-in-from-top-1 duration-200">
              <p className="text-stone-400 text-sm italic font-serif leading-relaxed">
                &quot;{aiData.analogy}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Reading Time */}
        <div className="border border-stone-800/20 rounded-lg overflow-hidden transition-all">
          <button 
            onClick={() => toggleSection('readingTime')}
            className="w-full flex items-center justify-between p-3 bg-stone-900/10 hover:bg-stone-900/30 transition-colors"
          >
            <span className="text-xs text-[#4b5563] uppercase tracking-widest font-bold">Metadata & Effort</span>
            {isCollapsed('readingTime') ? <ChevronDown className="w-3 h-3 text-stone-600" /> : <ChevronUp className="w-3 h-3 text-stone-600" />}
          </button>
          {!isCollapsed('readingTime') && (
            <div className="p-4 bg-[#0a0a0f]/30 animate-in slide-in-from-top-1 duration-200 flex items-center gap-8">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] text-stone-600 uppercase font-black tracking-widest flex items-center gap-1">
                   <Clock className="w-2.5 h-2.5" /> Reading Effort
                 </span>
                 <span className="text-stone-300 font-mono text-xs">{aiData.readingTimeMinutes} Minute Read</span>
               </div>
               <div className="w-px h-8 bg-stone-800/50" />
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] text-stone-600 uppercase font-black tracking-widest flex items-center gap-1">
                   <Layers className="w-2.5 h-2.5" /> Complexity
                 </span>
                 <span className="text-stone-300 font-mono text-xs uppercase tracking-tighter">{aiData.difficulty}</span>
               </div>
            </div>
          )}
        </div>

        {/* Raw Data */}
        <div className="border border-stone-800/20 rounded-lg overflow-hidden transition-all">
          <button 
            onClick={() => toggleSection('rawData')}
            className="w-full flex items-center justify-between p-3 bg-stone-900/10 hover:bg-stone-900/30 transition-colors"
          >
            <span className="text-xs text-[#4b5563] uppercase tracking-widest font-bold">Raw NVD Metadata</span>
            {isCollapsed('rawData') ? <ChevronDown className="w-3 h-3 text-stone-600" /> : <ChevronUp className="w-3 h-3 text-stone-600" />}
          </button>
          {!isCollapsed('rawData') && (
            <div className="p-4 bg-[#0a0a0f] border-t border-stone-800 overflow-x-auto animate-in slide-in-from-top-1 duration-200">
               <pre className="text-[10px] text-stone-500 font-mono leading-relaxed">
                 {JSON.stringify(cve.raw || cve, null, 2)}
               </pre>
            </div>
          )}
        </div>
      </div>

      {/* DISCLAMER */}
      <div className="pt-10 border-t border-stone-900 flex items-center gap-3 opacity-30">
        <Info className="w-3 h-3 text-stone-600" />
        <p className="text-[9px] text-stone-600 font-mono italic uppercase tracking-tighter">AI-generated summary • Verify with official NIST sources</p>
      </div>
    </div>
  );
}
