"use client";

import { useQuery } from "@tanstack/react-query";
import { CVESummary } from "@/types/cve";
import { SkeletonCard } from "../SkeletonCard";
import { GitCompare, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

interface SimilarCVEsProps {
  cveId: string;
}

export function SimilarCVEs({ cveId }: SimilarCVEsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["similar", cveId],
    queryFn: async () => {
      const res = await fetch(`/api/similar?cveId=${cveId}`);
      if (!res.ok) return { similar: [] };
      return res.json();
    },
    enabled: !!cveId,
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-64 shrink-0 h-32 bg-stone-900 animate-pulse rounded-lg border border-stone-800" />
        ))}
      </div>
    );
  }

  const similar = data?.similar || [];

  if (similar.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-[10px] font-bold text-stone-500 uppercase tracking-widest">Similar Vulnerabilities</h4>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
        {similar.map((item: any) => (
          <div 
            key={item.cveId} 
            className="w-72 shrink-0 bg-[#0a0a0f] border border-stone-800 p-4 rounded-xl flex flex-col justify-between group hover:border-sky-500/50 transition-all snap-start"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-stone-200">{item.cveId}</span>
                <span className="text-[10px] font-mono text-stone-500">{item.similarityScore?.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed italic">
                {item.reason}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-stone-800/50 flex items-center justify-between">
              <Link 
                href={`/compare?cve1=${cveId}&cve2=${item.cveId}`}
                className="text-[10px] font-bold uppercase text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
              >
                <GitCompare className="w-3 h-3" />
                Compare
              </Link>
              <Link 
                href={`/?cve=${item.cveId}`}
                className="text-stone-600 group-hover:text-stone-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
