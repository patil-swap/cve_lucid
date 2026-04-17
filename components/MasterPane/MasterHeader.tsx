"use client";

import { SearchBar } from "../SearchBar";
import { Button } from "../ui/button";
import { Filter, GitCompare } from "lucide-react";
import Link from "next/link";
import { useCompareStore } from "@/store/useCompareStore";

interface MasterHeaderProps {
  severityFilter: string;
  onFilterClick: () => void;
  onFilterSelect: (severity: string) => void;
}

export function MasterHeader({ severityFilter, onFilterClick, onFilterSelect }: MasterHeaderProps) {
  const { selectedIds } = useCompareStore();
  const canCompare = selectedIds.length === 2;

  return (
    <header className="sticky top-0 z-20 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-stone-800 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-grow">
          <SearchBar />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onFilterClick}
          className={`shrink-0 border-stone-800 bg-stone-900/50 ${severityFilter !== 'ALL' ? 'text-sky-400 border-sky-900/50' : 'text-stone-400'}`}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
           {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
             <button 
               key={s} 
               onClick={() => onFilterSelect(s)}
               className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                 severityFilter === s ? 'bg-sky-500/10 border-sky-500/50 text-sky-400' : 'border-stone-800 text-stone-500 hover:border-stone-700'
               }`}
             >
               {s}
             </button>
           ))}
        </div>
        
        <Link 
          href={canCompare ? `/compare?cve1=${selectedIds[0]}&cve2=${selectedIds[1]}` : "#"}
          onClick={(e) => !canCompare && e.preventDefault()}
          className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
            canCompare 
              ? 'bg-sky-500/10 border-sky-500/50 text-sky-400 hover:bg-sky-500/20' 
              : 'border-stone-800 text-stone-600 cursor-not-allowed opacity-50'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span className="font-mono text-[10px] whitespace-nowrap uppercase tracking-tighter">
            Compare {selectedIds.length > 0 ? `(${selectedIds.length}/2)` : ''}
          </span>
        </Link>
      </div>
    </header>
  );
}
