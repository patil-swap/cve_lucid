"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeCveId = searchParams.get("cve");

  const { data, isLoading } = useQuery({
    queryKey: ["cves", page, severityFilter],
    queryFn: async () => {
      let url = `/api/cves?page=${page}`;
      if (severityFilter !== "ALL") {
        url += `&severity=${severityFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load CVEs");
      return res.json();
    },
  });

  // Find the selected CVE object from the list to pass to DetailPane
  // If not found in current page, we'll need a way to fetch individual CVE (Phase 4 polish)
  const selectedCVE = data?.cves.find((c: CVESummary) => c.id === activeCveId) || null;

  const handleSelect = (cve: CVESummary) => {
    if (window.innerWidth < 768) {
      router.push(`/cve/${cve.id}`);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("cve", cve.id);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Sidebar: Master Pane */}
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

      {/* Main Content: Detail Pane */}
      <div className="hidden md:block flex-grow">
        <DetailPane selectedCVE={selectedCVE} />
      </div>

      {/* Filter Drawer (Mobile/Desktop) */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="left" className="bg-[#0e0e16] border-stone-800 text-stone-100">
          <SheetHeader>
            <SheetTitle>Filter Vulnerabilities</SheetTitle>
            <SheetDescription>Narrow down the master list by severity.</SheetDescription>
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

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0a0f] flex items-center justify-center font-mono text-stone-500">Initializing Workspace...</div>}>
      <HomeContent />
    </Suspense>
  );
}
