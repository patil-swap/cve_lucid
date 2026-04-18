import { useQuery } from "@tanstack/react-query";
import { CVESummary } from "@/types/cve";
import { DetailHeader } from "./DetailHeader";
import { SimilarCVEs } from "./SimilarCVEs";
import { WhatIfExplainer } from "../WhatIfExplainer";
import { ImpactSimulation } from "../ImpactSimulation";
import { Button } from "../ui/button";
import { ShieldAlert, Info, ChevronDown, ChevronUp, Bug, CheckCircle2, FlaskConical } from "lucide-react";
import { useState } from "react";

interface DetailPaneProps {
  selectedCVE: CVESummary | null;
}

export function DetailPane({ selectedCVE }: DetailPaneProps) {
  const [showRaw, setShowRaw] = useState(false);

  const { data: aiData, isLoading, isError } = useQuery({
    queryKey: ["explain", selectedCVE?.id],
    queryFn: async () => {
      if (!selectedCVE) return null;
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cveId: selectedCVE.id,
          rawNvdData: selectedCVE.raw,
        }),
      });
      if (!res.ok) throw new Error("Failed LLM explanation");
      return res.json();
    },
    enabled: !!selectedCVE,
  });

  if (!selectedCVE) {
    return (
      <div className="flex-grow bg-[#05050a] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-stone-900/50 rounded-full flex items-center justify-center mb-6 border border-stone-800/50 shadow-2xl">
          <ShieldAlert className="w-10 h-10 text-stone-700" />
        </div>
        <h2 className="text-xl font-mono text-stone-400 font-bold mb-2">No Vulnerability Selected</h2>
        <p className="text-stone-600 text-sm max-w-xs leading-relaxed font-mono italic">
          Select a CVE from the list to view its technical reality, business impact, and analogy.
        </p>
      </div>
    );
  }

  return (
    <div key={selectedCVE.id} className="flex-grow bg-[#05050a] h-screen overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-grow">
        <DetailHeader cve={selectedCVE} />

        <div className="p-6 lg:p-10 max-w-5xl space-y-12 pb-24">

          {/* Status Highlights */}
          <div className="flex flex-wrap gap-4 mt-2">
            {selectedCVE.isZeroDay === 1 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-full">
                <Bug className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Zero-Day Found</span>
              </div>
            )}
            {selectedCVE.patchAvailable === 1 ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Patch Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">No Fixed Version</span>
              </div>
            )}
            {selectedCVE.exploitExists === 1 && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-full">
                <FlaskConical className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Exploit Available</span>
              </div>
            )}
          </div>

          {/* AI Analysis Sections */}
          <div className="space-y-10">
            {isLoading ? (
              <div className="space-y-10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="h-4 bg-stone-900 rounded w-1/4"></div>
                    <div className="h-4 bg-stone-900 rounded w-full"></div>
                    <div className="h-4 bg-stone-900 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-3 text-red-400 mb-4 font-mono text-sm font-bold">
                  <ShieldAlert className="w-5 h-5" />
                  AI Analysis Unavailable
                </div>
                <p className="text-stone-400 text-sm italic mb-6">Failed to generate simplified view. Showing raw description:</p>
                <p className="text-stone-300 text-sm leading-relaxed">{selectedCVE.description}</p>
              </div>
            ) : aiData && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-sky-500 rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em]">The Technical Reality</h4>
                  </div>
                  <div className="px-4 border-l border-sky-500/100">
                    <p className="text-stone-300 text-[18px] leading-relaxed max-w-4xl selection:bg-sky-500/30">{aiData.technicalReality}</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Plain English</h4>
                  </div>
                  <div className="px-4 border-l border-emerald-500/100">
                    <p className="text-stone-300 text-[18px] leading-relaxed max-w-4xl whitespace-pre-line selection:bg-emerald-500/30">{aiData.plainEnglish}</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">The Analogy</h4>
                  </div>
                  <div className="px-4 border-l border-amber-500/100">
                    <p className="text-stone-200 text-[18px] italic tracking-tight font-serif selection:bg-amber-500/30">&quot;{aiData.analogy}&quot;</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-violet-500 rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">Remediation Guide</h4>
                  </div>
                  <div className="px-4 border-l border-violet-500/100">
                    <div className="text-stone-300 text-[18px] leading-relaxed whitespace-pre-line selection:bg-violet-500/30">
                      {aiData.howToFix}
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                  <WhatIfExplainer cve={selectedCVE} />
                  <ImpactSimulation cve={selectedCVE} />
                </div>

                {/* Meta Stats */}
                <div className="flex items-center gap-8 py-6 border-y border-stone-800/50 mt-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-stone-600 uppercase font-black tracking-widest">Reading Effort</span>
                    <span className="text-stone-300 font-mono text-xs">{aiData.readingTimeMinutes} Minute Read</span>
                  </div>
                  <div className="w-px h-8 bg-stone-800" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-stone-600 uppercase font-black tracking-widest">Conceptual Complexity</span>
                    <span className="text-stone-300 font-mono text-xs underline decoration-stone-700 underline-offset-4">{aiData.difficulty}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Similar CVEs (Horizontal Scroll) */}
          <div className="pt-10 border-t border-stone-800/30">
            <SimilarCVEs cveId={selectedCVE.id} />
          </div>

          {/* Raw Data Toggle */}
          <div className="pt-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRaw(!showRaw)}
              className="text-stone-600 hover:text-stone-300 px-0 flex items-center gap-2"
            >
              {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span className="text-[10px] font-bold uppercase tracking-widest">Raw NVD Metadata</span>
            </Button>

            {showRaw && (
              <div className="mt-4 p-6 bg-[#0a0a0f] border border-stone-800 rounded-lg overflow-x-auto">
                <pre className="text-[11px] text-stone-500 font-mono leading-relaxed">
                  {JSON.stringify(selectedCVE.raw || selectedCVE, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="pb-20 pt-10 border-t border-stone-900 flex items-center gap-3 opacity-30">
            <Info className="w-4 h-4 text-stone-600" />
            <p className="text-[10px] text-stone-600 font-mono italic uppercase">AI-generated summary • Verify with official source</p>
          </div>
        </div>
      </div>
    </div>
  );
}
