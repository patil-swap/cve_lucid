"use client";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { CVESummary, severityColorMap } from "@/types/cve";
import { SeverityBadge } from "../SeverityBadge";
import { useState, useEffect } from "react";
import { useCompareStore } from "@/store/useCompareStore";

function truncate(str: string, max: number) {
  return str.length > max ? str.substring(0, max - 3) + "..." : str;
}

interface CVEMasterCardProps {
  cve: CVESummary;
  isActive: boolean;
  onClick: (cve: CVESummary) => void;
}

export function CVEMasterCard({ cve, isActive, onClick }: CVEMasterCardProps) {
  const [mounted, setMounted] = useState(false);
  const { selectedIds, toggleSelection } = useCompareStore();
  const isSelected = selectedIds.includes(cve.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  const borderLeft = severityColorMap[cve.severity] || "border-l-gray-500";

  return (
    <Card 
      className={`flex flex-col flex-shrink-0 bg-[#0e0e16] border-stone-800 border-l-[4px] transition-all cursor-pointer group hover:bg-[#111118] ${
        isActive 
          ? `bg-[#14141f] border-stone-700 ring-1 ring-inset ring-stone-700/50 ${borderLeft}` 
          : `opacity-90 grayscale-[0.2] hover:grayscale-0 hover:scale-[0.98] ${borderLeft}`
      }`}
      onClick={() => onClick(cve)}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              toggleSelection(cve.id);
            }}
            className="flex items-center p-1 -ml-1 group/check"
          >
             <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
               isSelected ? 'bg-sky-500 border-sky-400' : 'bg-transparent border-stone-700 group-hover/check:border-stone-500'
             }`}>
               {isSelected && <div className="w-1.5 h-1.5 bg-stone-950 rounded-full" />}
             </div>
          </div>
          <h3 className={`font-mono text-sm font-semibold transition-colors ${isActive ? 'text-stone-100' : 'text-stone-400 group-hover:text-stone-200'}`}>
            {cve.id}
          </h3>
        </div>
        <SeverityBadge severity={cve.severity} />
      </CardHeader>
      
      <CardContent className="px-4 py-2 flex-grow flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
           <span className={`text-2xl font-bold tracking-tighter tabular-nums ${isActive ? 'text-stone-50' : 'text-stone-300'}`}>
             {cve.cvssScore !== null ? cve.cvssScore.toFixed(1) : "--"}
           </span>
           {cve.affectedProducts.length > 0 && (
             <span className="text-[10px] font-semibold text-stone-500 uppercase truncate max-w-[150px]">
               {cve.affectedProducts[0]}
             </span>
           )}
        </div>
        
        <p className={`text-[16px] leading-relaxed line-clamp-2 ${isActive ? 'text-stone-300' : 'text-stone-500 group-hover:text-stone-400'}`}>
          {cve.description}
        </p>
      </CardContent>

      <CardFooter className="px-4 py-3 text-[10px] text-stone-600 flex justify-between border-t border-stone-800/40">
        <span>{mounted ? new Date(cve.publishedDate).toLocaleDateString() : "--"}</span>
      </CardFooter>
    </Card>
  );
}
