import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleSelector } from "./RoleSelector";
import { CVESummary } from "@/types/cve";

export function WhatIfExplainer({ cve }: { cve: CVESummary }) {
  const [role, setRole] = useState<"engineer" | "manager" | "executive">("engineer");

  // Mount logic handling localStorage persistence seamlessly
  useEffect(() => {
     const stored = localStorage.getItem("cve-role");
     if (stored === "engineer" || stored === "manager" || stored === "executive") {
         setRole(stored);
     }
  }, []);

  const changeRole = (r: "engineer" | "manager" | "executive") => {
     setRole(r);
     localStorage.setItem("cve-role", r);
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["whatif", cve.id, role],
    queryFn: async () => {
      const res = await fetch(`/api/explain?role=${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cveId: cve.id, rawNvdData: cve.raw }),
      });
      if (!res.ok) throw new Error("Failed LLM what-if explanation");
      return res.json();
    },
  });

  return (
    <div className="bg-[#05050a] p-4 rounded-lg border border-stone-800 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-rose-400 uppercase tracking-wider text-xs">What If Explainer</h4>
        <div className="w-64">
           <RoleSelector selectedRole={role} onChange={changeRole} />
        </div>
      </div>
      
      <div className="text-stone-300 text-sm leading-relaxed min-h-[60px]">
        {isLoading ? (
           <div className="animate-pulse space-y-2">
              <div className="h-3 bg-stone-800 rounded w-full"></div>
              <div className="h-3 bg-stone-800 rounded w-5/6"></div>
              <div className="h-3 bg-stone-800 rounded w-4/6"></div>
           </div>
        ) : isError ? (
           <span className="text-red-400">Failed to load explainer logic.</span>
        ) : (
           <p className="whitespace-pre-line leading-relaxed">{data?.impactText || "Loading..."}</p>
        )}
      </div>
    </div>
  );
}
