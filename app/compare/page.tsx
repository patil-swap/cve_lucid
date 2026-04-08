"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { CVESummary } from "@/types/cve";
import { SeverityBadge } from "@/components/SeverityBadge";

import { Suspense } from "react";

function CompareContent() {
  const searchParams = useSearchParams();
  const cve1Id = searchParams.get("cve1");
  const cve2Id = searchParams.get("cve2");

  const [data, setData] = useState<{
    cve1: CVESummary, 
    cve2: CVESummary, 
    diff: { 
      cvssScore: { cve1: number, cve2: number, difference: string }, 
      summaryDiff: string 
    }
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
     if (!cve1Id || !cve2Id) return;
     setLoading(true);
     fetch(`/api/compare?cve1=${cve1Id}&cve2=${cve2Id}`)
       .then(res => res.json())
       .then(res => {
          if (res.error) setError(res.error);
          else setData(res);
       })
       .catch(() => setError("Failed to establish secure connection."))
       .finally(() => setLoading(false));
  }, [cve1Id, cve2Id]);

  if (!cve1Id || !cve2Id) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h2 className="text-xl font-mono text-stone-300">Select two CVE identifiers to initialize logic.</h2>
         </div>
      );
  }

  return (
      <main className="container mx-auto px-4 py-12">
         <h1 className="text-3xl font-mono mb-8 border-b border-stone-800 pb-4 text-stone-200">
             Comparative Analysis: <span className="text-sky-400">{cve1Id}</span> vs <span className="text-sky-400">{cve2Id}</span>
         </h1>

         {loading && <div className="text-stone-400 font-mono animate-pulse bg-stone-900/50 p-6 rounded-md">Fetching vulnerability metrics from NIST frameworks...</div>}
         {error && <div className="text-red-400 bg-red-500/10 p-4 rounded border border-red-500/20">{error}</div>}

         {data && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-[#0e0e16] p-6 rounded-lg border border-stone-800 space-y-4">
                    <h2 className="text-2xl font-mono flex items-center gap-3 text-stone-200">
                       {data.cve1.id}
                       <SeverityBadge severity={data.cve1.severity} />
                    </h2>
                    <ul className="text-stone-400 space-y-2 text-sm font-mono border-t border-stone-800/60 pt-4">
                       <li>CVSS Base Score: <span className="text-stone-200">{data.cve1.cvssScore ?? "N/A"}</span></li>
                       <li>Target Products: <span className="text-stone-200">{data.cve1.affectedProducts?.join(", ")}</span></li>
                       <li>NVD Published:   <span className="text-stone-200">{new Date(data.cve1.publishedDate).toLocaleDateString()}</span></li>
                    </ul>
                 </div>

                 <div className="bg-[#0e0e16] p-6 rounded-lg border border-stone-800 space-y-4">
                    <h2 className="text-2xl font-mono flex items-center gap-3 text-stone-200">
                       {data.cve2.id}
                       <SeverityBadge severity={data.cve2.severity} />
                    </h2>
                    <ul className="text-stone-400 space-y-2 text-sm font-mono border-t border-stone-800/60 pt-4">
                       <li>CVSS Base Score: <span className="text-stone-200">{data.cve2.cvssScore ?? "N/A"}</span></li>
                       <li>Target Products: <span className="text-stone-200">{data.cve2.affectedProducts?.join(", ")}</span></li>
                       <li>NVD Published:   <span className="text-stone-200">{new Date(data.cve2.publishedDate).toLocaleDateString()}</span></li>
                    </ul>
                 </div>
               </div>

               {data.diff.summaryDiff && (
                  <div className="bg-sky-500/5 p-6 rounded-lg border border-sky-500/20">
                     <h3 className="text-sky-400 font-semibold tracking-widest text-xs uppercase mb-3 text-center">AI Comparison Summary</h3>
                     <p className="text-stone-300 text-center leading-relaxed italic">&quot;{data.diff.summaryDiff}&quot;</p>
                  </div>
               )}

               <div className="bg-[#0e0e16] rounded-lg border border-stone-800 overflow-hidden shadow-2xl">
                   <div className="p-4 border-b border-stone-800 bg-stone-900/50 flex items-center">
                       <h3 className="text-emerald-400 font-semibold tracking-widest text-xs uppercase">Description Textual Discrepancies</h3>
                   </div>
                   <div className="text-xs">
                     <ReactDiffViewer 
                       oldValue={data.cve1.description} 
                       newValue={data.cve2.description} 
                       splitView={true}
                       useDarkTheme={true}
                       styles={{
                          variables: {
                              dark: {
                                  diffViewerBackground: '#05050a',
                                  diffViewerColor: '#d6d3d1',
                                  addedBackground: 'rgba(16, 185, 129, 0.15)',
                                  removedBackground: 'rgba(239, 68, 68, 0.15)',
                                  wordAddedBackground: 'rgba(16, 185, 129, 0.4)',
                                  wordRemovedBackground: 'rgba(239, 68, 68, 0.4)',
                                  gutterBackground: '#0e0e16',
                                  gutterBackgroundDark: '#0e0e16'
                              }
                          }
                       }}
                     />
                   </div>
               </div>
            </div>
         )}
      </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse text-center">
        <div className="h-10 bg-stone-900 rounded w-1/2 mx-auto mb-8"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-stone-900 rounded"></div>
          <div className="h-48 bg-stone-900 rounded"></div>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
