"use client";

import { useQuery } from "@tanstack/react-query";
import { DetailPane } from "@/components/DetailPane/DetailPane";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SkeletonCard } from "@/components/SkeletonCard";

import React from "react";

export default function MobileDetailPage({ params }: { params: Promise<{ cveId: string }> }) {
  const { cveId } = React.use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cve", cveId],
    queryFn: async () => {
      const res = await fetch(`/api/cves/${cveId}`);
      if (!res.ok) throw new Error("Failed to fetch CVE");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05050a] p-8 space-y-8">
        <div className="h-10 bg-stone-900 rounded w-1/4 animate-pulse"></div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-xl font-mono text-red-500 mb-4 font-bold tracking-tighter uppercase">Vulnerability Not Found</h1>
        <p className="text-stone-500 text-sm mb-8">The CVE ID {cveId} could not be retrieved from the indexing service.</p>
        <Button asChild variant="outline" className="border-stone-800">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#05050a]">
      <div className="sticky top-0 z-30 bg-[#05050a] p-4 border-b border-stone-900 md:hidden flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="text-stone-400 -ml-2">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Back to List</span>
          </Link>
        </Button>
      </div>
      
      {/* We reuse DetailPane but need to ensure it's visible on mobile here */}
      <div className="md:block block">
         <DetailPane selectedCVE={data} />
      </div>
    </main>
  );
}
