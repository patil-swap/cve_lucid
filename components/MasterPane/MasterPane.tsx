import { CVESummary } from "@/types/cve";
import { useState, useEffect } from "react";
import { CVEMasterCard } from "./CVEMasterCard";
import { MasterHeader } from "./MasterHeader";
import { Button } from "../ui/button";
import { SkeletonCard } from "../SkeletonCard";

interface MasterPaneProps {
  cves: CVESummary[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (cve: CVESummary) => void;
  page: number;
  totalResults?: number;
  onPageChange: (page: number) => void;
  severityFilter: string;
  onFilterToggle: () => void;
  onFilterSelect: (severity: string) => void;
}

export function MasterPane({
  cves,
  isLoading,
  activeId,
  onSelect,
  page,
  totalResults,
  onPageChange,
  severityFilter,
  onFilterToggle,
  onFilterSelect,
}: MasterPaneProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPages = totalResults ? Math.ceil(totalResults / 20) : 0;
  const isPagingDisabled = !mounted || isLoading;

  return (
    <aside className="flex flex-col h-screen border-r border-stone-800 bg-[#0a0a0f] overflow-hidden w-full md:w-[350px] lg:w-[500px] shrink-0">
      <MasterHeader
        severityFilter={severityFilter}
        onFilterClick={onFilterToggle}
        onFilterSelect={onFilterSelect}
      />

      <div className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : cves.length === 0 ? (
          <div className="text-center py-20 text-stone-600 font-mono text-xs">No vulnerabilities found matching criteria.</div>
        ) : (
          cves.map((cve) => (
            <CVEMasterCard
              key={cve.id}
              cve={cve}
              isActive={cve.id === activeId}
              onClick={onSelect}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-stone-800 bg-[#0a0a0f]/50 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={isPagingDisabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="text-[10px] uppercase font-bold text-stone-500 hover:text-stone-300"
        >
          Previous
        </Button>
        <div className="text-[10px] font-mono text-stone-600">
          {mounted ? `PAGE ${page} ${totalPages > 0 ? `OF ${totalPages}` : ''}` : '--'}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPagingDisabled || (cves.length < 20) || (totalPages > 0 && page >= totalPages)}
          onClick={() => onPageChange(page + 1)}
          className="text-[10px] uppercase font-bold text-stone-500 hover:text-stone-300"
        >
          Next
        </Button>
      </div>
    </aside>
  );
}
