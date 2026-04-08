import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CVESummary } from "@/types/cve";
import { Button } from "./ui/button";

export function ImpactSimulation({ cve }: { cve: CVESummary }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["impact", cve.id],
    queryFn: async () => {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cveId: cve.id, rawNvdData: cve.raw }),
      });
      if (!res.ok) throw new Error("Failed LLM simulation");
      return res.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) {
    return (
      <Button variant="outline" className="w-full bg-[#0e0e16] border-stone-800 text-stone-400 mt-4" onClick={() => setIsOpen(true)}>
         Simulate Impact in Environment
      </Button>
    );
  }

  return (
    <div className="bg-[#05050a] p-4 rounded-lg border border-stone-800 space-y-4 mt-6">
      <div className="flex justify-between items-center mb-2 border-b border-stone-800 pb-2">
        <h4 className="font-semibold text-rose-400 uppercase tracking-wider text-xs">Simulated Environment Architecture Impact</h4>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 text-xs text-stone-500 hover:text-stone-300 hover:bg-stone-900 p-0 px-2 rounded">Hide</Button>
      </div>

      <div className="text-stone-300 text-sm leading-relaxed min-h-[80px]">
        {isLoading ? (
           <div className="animate-pulse space-y-4">
              <div className="h-3 bg-stone-800 rounded w-1/3"></div>
              <div className="h-3 bg-stone-800 rounded w-full"></div>
              <div className="h-3 bg-stone-800 rounded w-5/6"></div>
           </div>
        ) : isError ? (
           <span className="text-red-400">Simulation failed to map against payload limits.</span>
        ) : data ? (
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold block mb-1">Confidentiality</span>
                  <p className="text-sm leading-relaxed">{data.confidentiality}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold block mb-1">Integrity</span>
                  <p className="text-sm leading-relaxed">{data.integrity}</p>
                </div>
             </div>
             
             <div>
                <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold block mb-1">Availability & Blast Radius</span>
                <p className="text-sm leading-relaxed">{data.availability} — {data.blastRadius}</p>
             </div>

             {data.exploitationComplexity && (
               <div>
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold block mb-1">Exploitation Complexity</span>
                  <p className="text-sm leading-relaxed font-mono mt-1 text-stone-400">Time: {data.exploitationComplexity.timeToExploit} | Skill: {data.exploitationComplexity.skillLevel}</p>
               </div>
             )}

             {data.attackChain && data.attackChain.length > 0 && (
               <div className="pt-4 mt-2 border-t border-stone-800/60">
                  <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold block mb-2">Hypothetical Attack Chain</span>
                  <ul className="text-stone-400 list-disc pl-4 space-y-1.5 text-xs font-mono">
                     {data.attackChain.map((step: string, i: number) => <li key={i}>{step}</li>)}
                  </ul>
               </div>
             )}

             <p className="text-[10px] text-stone-600/80 italic mt-4 pt-2">{data.disclaimer}</p>
           </div>
        ) : null}
      </div>
    </div>
  );
}
