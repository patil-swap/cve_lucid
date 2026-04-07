import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useModalStore } from "@/store/useModalStore";
import { SeverityBadge } from "./SeverityBadge";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

function AILoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-stone-800 rounded w-3/4"></div>
      <div className="h-4 bg-stone-800 rounded w-full"></div>
      <div className="h-4 bg-stone-800 rounded w-5/6"></div>
    </div>
  );
}

export function CVEModal() {
  const { isOpen, selectedCVE, closeModal } = useModalStore();
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

  if (!selectedCVE) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-2xl bg-[#0e0e16] border-stone-800 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-stone-800 pb-4">
          <div className="flex justify-between items-start pr-4">
            <div>
              <DialogTitle className="font-mono text-xl flex items-center gap-3">
                {selectedCVE.id}
                <SeverityBadge severity={selectedCVE.severity} />
              </DialogTitle>
              <DialogDescription className="mt-2 text-stone-400 flex items-center gap-2">
                CVSS: {selectedCVE.cvssScore ?? "N/A"}
                <span className="text-stone-700">|</span>
                Pub: {new Date(selectedCVE.publishedDate).toLocaleDateString()}
              </DialogDescription>
            </div>
            <a 
              href={`https://nvd.nist.gov/vuln/detail/${selectedCVE.id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {isLoading ? (
            <div className="space-y-6">
               <div><h4 className="font-semibold text-stone-300 mb-2">Technical Reality</h4><AILoadingSkeleton /></div>
               <div><h4 className="font-semibold text-stone-300 mb-2">Plain English</h4><AILoadingSkeleton /></div>
            </div>
          ) : isError ? (
            <div className="bg-red-500/10 text-red-400 p-4 rounded text-sm border border-red-500/20">
              Failed to generate AI explanation.
              <p className="mt-2 text-stone-300">{selectedCVE.description}</p>
            </div>
          ) : aiData ? (
            <>
              <section>
                <h4 className="font-semibold text-sky-400 mb-2 uppercase tracking-wider text-xs">The Technical Reality</h4>
                <p className="text-stone-300 text-sm leading-relaxed">{aiData.technicalReality}</p>
              </section>

              <section>
                <h4 className="font-semibold text-emerald-400 mb-2 uppercase tracking-wider text-xs">Plain English</h4>
                <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">{aiData.plainEnglish}</p>
              </section>

              <section>
                <h4 className="font-semibold text-amber-400 mb-2 uppercase tracking-wider text-xs">The Analogy</h4>
                <p className="text-stone-300 text-sm italic border-l-2 border-amber-500/30 pl-3 py-1">&quot;{aiData.analogy}&quot;</p>
              </section>

              <section>
                <h4 className="font-semibold text-violet-400 mb-2 uppercase tracking-wider text-xs">How to Fix</h4>
                <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">{aiData.howToFix}</p>
              </section>
            </>
          ) : null}

          <div className="pt-4 border-t border-stone-800">
             <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)} className="text-stone-400">
               {showRaw ? "Hide" : "Show"} Raw Data
             </Button>
             {showRaw && (
               <pre className="mt-4 p-4 bg-[#05050a] text-xs text-stone-500 rounded font-mono overflow-auto max-h-[300px]">
                 {JSON.stringify(selectedCVE.raw, null, 2)}
               </pre>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
