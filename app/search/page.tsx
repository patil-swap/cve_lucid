"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CVEGrid } from "@/components/CVEGrid";
import { CVEModal } from "@/components/CVEModal";
import { Button } from "@/components/ui/button";

import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["search", query, page, severityFilter],
    queryFn: async () => {
      let url = `/api/search?q=${encodeURIComponent(query)}&page=${page}`;
      if (severityFilter !== "ALL") {
        url += `&severity=${severityFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to execute search");
      return res.json();
    },
    enabled: !!query || severityFilter !== "ALL",
  });

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-6">
        <div>
          <h1 className="text-2xl font-mono text-stone-200">
            Search Results for: <span className="text-sky-400">&quot;{query}&quot;</span>
          </h1>
          <p className="text-stone-500 font-mono text-xs mt-1">
            {data?.totalResults ?? 0} vulnerabilities found in local index.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "ALL", label: "All", colorClass: "text-stone-200" },
            { value: "CRITICAL", label: "Critical", colorClass: "text-red-500" },
            { value: "HIGH", label: "High", colorClass: "text-orange-500" },
            { value: "MEDIUM", label: "Medium", colorClass: "text-yellow-500" },
            { value: "LOW", label: "Low", colorClass: "text-green-500" },
          ].map((filter) => {
            const isActive = severityFilter === filter.value;
            return (
              <Button
                key={filter.value}
                variant="outline"
                className={`rounded-full h-8 px-4 text-xs font-bold tracking-wide transition-all ${isActive
                    ? `bg-stone-800 border-stone-700 ${filter.colorClass}`
                    : "bg-[#0e0e16] border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-300"
                  }`}
                onClick={() => {
                  setSeverityFilter(filter.value);
                  setPage(1);
                }}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>
      </header>

      {isError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md flex justify-between items-center">
          <p>Search execution failed. Database might be initializing.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry Search</Button>
        </div>
      )}

      {!query && severityFilter === "ALL" && (
         <div className="text-center py-20 text-stone-500 font-mono">
            Enter a search term above to begin querying the CVE index.
         </div>
      )}

      {data?.cves && <CVEGrid cves={data.cves} isLoading={isLoading} />}

      {data?.totalResults > 0 && (
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-stone-800">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-stone-400 font-mono text-sm">Page {page} of {Math.ceil(data.totalResults / 20)}</span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={isLoading || page >= Math.ceil(data.totalResults / 20)}
          >
            Next
          </Button>
        </div>
      )}

      <CVEModal />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-stone-900 rounded w-1/3"></div>
        <div className="h-64 bg-stone-900 rounded"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
