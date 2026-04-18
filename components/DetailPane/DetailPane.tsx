import { useQuery } from "@tanstack/react-query";
import { CVESummary } from "@/types/cve";
import { DetailHeader } from "./DetailHeader";
import { CVEDetail } from "./CVEDetail";
import { ShieldAlert } from "lucide-react";

interface DetailPaneProps {
  selectedCVE: CVESummary | null;
}

export function DetailPane({ selectedCVE }: DetailPaneProps) {
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
      <div className="flex-grow w-full relative">
        <DetailHeader cve={selectedCVE} />

        {isLoading ? (
          <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-4 bg-stone-900 rounded w-1/4"></div>
                <div className="h-4 bg-stone-900 rounded w-full"></div>
                <div className="h-4 bg-stone-900 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="max-w-2xl mx-auto px-6 py-10">
            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3 text-red-400 mb-4 font-mono text-sm font-bold">
                <ShieldAlert className="w-5 h-5" />
                AI Analysis Unavailable
              </div>
              <p className="text-stone-300 text-sm leading-relaxed">{selectedCVE.description}</p>
            </div>
          </div>
        ) : aiData && (
          <CVEDetail cve={selectedCVE} aiData={aiData} />
        )}
      </div>
    </div>
  );
}
