"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CVEGrid } from "@/components/CVEGrid";
import { CVEModal } from "@/components/CVEModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const { data, isLoading, isError, refetch } = useQuery({
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

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">CVE Simplified</h1>
          <p className="text-stone-400 mt-2">Security advisories made readable.</p>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={severityFilter}
            onValueChange={(val) => {
              setSeverityFilter(val);
              setPage(1); // Reset page on filter mutate
            }}
          >
            <SelectTrigger className="w-[180px] bg-[#0e0e16] border-stone-800 text-stone-200">
              <SelectValue placeholder="Filter by Severity" />
            </SelectTrigger>
            <SelectContent className="bg-[#0e0e16] border-stone-800 text-stone-200">
              <SelectItem value="ALL" className="cursor-pointer hover:bg-stone-800">All Severities</SelectItem>
              <SelectItem value="CRITICAL" className="cursor-pointer hover:bg-stone-800 text-red-500 font-semibold focus:text-red-500">Critical</SelectItem>
              <SelectItem value="HIGH" className="cursor-pointer hover:bg-stone-800 text-orange-500 font-semibold focus:text-orange-500">High</SelectItem>
              <SelectItem value="MEDIUM" className="cursor-pointer hover:bg-stone-800 text-yellow-500 font-semibold focus:text-yellow-500">Medium</SelectItem>
              <SelectItem value="LOW" className="cursor-pointer hover:bg-stone-800 text-green-500 font-semibold focus:text-green-500">Low</SelectItem>
              <SelectItem value="UNKNOWN" className="cursor-pointer hover:bg-stone-800 text-gray-500 font-semibold focus:text-gray-500">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {isError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md flex justify-between items-center">
          <p>Failed to load CVEs. The NVD API might be rate-limiting us.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      <CVEGrid cves={data?.cves || []} isLoading={isLoading} />

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-stone-800">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
        >
          Previous
        </Button>
        <span className="text-stone-400">Page {page} {data?.totalResults ? `of ${Math.ceil(data.totalResults / 20)}` : ''}</span>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
          disabled={isLoading || (data && data.cves.length < 20) || (data?.totalResults && page >= Math.ceil(data.totalResults / 20))}
        >
          Next
        </Button>
      </div>

      <CVEModal />
    </main>
  );
}
