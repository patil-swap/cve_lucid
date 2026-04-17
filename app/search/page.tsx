"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { MasterPane } from "@/components/MasterPane/MasterPane";
import { DetailPane } from "@/components/DetailPane/DetailPane";
import { CVESummary } from "@/types/cve";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const activeCveId = searchParams.get("cve");
  
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query, page, severityFilter],
    queryFn: async () => {
      let url = `/api/search?q=${encodeURIComponent(query)}&page=${page}`;
      if (severityFilter !== "ALL") {
        url += `&severity=${severityFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load search results");
      return res.json();
    },
    enabled: !!query || severityFilter !== "ALL",
  });

  const selectedCVE = data?.cves.find((c: CVESummary) => c.id === activeCveId) || null;

  const handleSelect = (cve: CVESummary) => {
    if (window.innerWidth < 768) {
      router.push(`/cve/${cve.id}`);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("cve", cve.id);
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <MasterPane 
        cves={data?.cves || []}
        isLoading={isLoading}
        activeId={activeCveId}
        onSelect={handleSelect}
        page={page}
        totalResults={data?.totalResults}
        onPageChange={handlePageChange}
        severityFilter={severityFilter}
        onFilterToggle={() => setIsFilterOpen(true)}
        onFilterSelect={(s) => {
          setSeverityFilter(s);
          setPage(1);
        }}
      />

      <div className="hidden md:block flex-grow">
        <DetailPane selectedCVE={selectedCVE} />
      </div>

      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="left" className="bg-[#0e0e16] border-stone-800 text-stone-100">
          <SheetHeader>
            <SheetTitle>Search Filters</SheetTitle>
            <SheetDescription>Filter results for &quot;{query}&quot;</SheetDescription>
          </SheetHeader>
          <div className="py-8 space-y-6">
            <div className="space-y-3">
               <label className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Severity Level</label>
               <div className="flex flex-col gap-2">
                 {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
                   <Button
                     key={s}
                     variant={severityFilter === s ? "default" : "outline"}
                     onClick={() => {
                        setSeverityFilter(s);
                        setPage(1);
                        setIsFilterOpen(false);
                     }}
                     className={`justify-start font-mono text-xs ${severityFilter === s ? 'bg-sky-600 hover:bg-sky-700' : 'border-stone-800'}`}
                   >
                     {s}
                   </Button>
                 ))}
               </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-stone-500 italic uppercase tracking-widest">Executing Search Query...</div>}>
      <SearchContent />
    </Suspense>
  );
}
