import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { CVESummary } from "@/types/cve";
import { SeverityBadge } from "./SeverityBadge";
import { useModalStore } from "@/store/useModalStore";
import { useState, useEffect } from "react";

function truncate(str: string, max: number) {
  return str.length > max ? str.substring(0, max - 3) + "..." : str;
}

export function CVECard({ cve }: { cve: CVESummary }) {
  const { openModal } = useModalStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const severityColorMap: Record<string, string> = {
    CRITICAL: "border-l-red-500",
    HIGH: "border-l-orange-500",
    MEDIUM: "border-l-yellow-500",
    LOW: "border-l-green-500",
  };

  const borderLeft = severityColorMap[cve.severity] || "border-l-gray-500";

  return (
    <Card 
      className={`flex flex-col h-full bg-[#0e0e16] border-stone-800 border-l-[3px] hover:bg-[#14141f] transition-colors cursor-pointer ${borderLeft}`}
      onClick={() => openModal(cve)}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <h3 className="font-mono text-[15px] font-semibold">{cve.id}</h3>
        <SeverityBadge severity={cve.severity} />
      </CardHeader>
      
      <CardContent className="py-2 flex-grow flex flex-col gap-2">
        <div className="text-3xl font-bold tracking-tighter tabular-nums text-stone-200">
          {cve.cvssScore !== null ? cve.cvssScore.toFixed(1) : "N/A"}
        </div>
        
        {cve.affectedProducts.length > 0 && (
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            {cve.affectedProducts.join(", ")}
          </div>
        )}

        <p className="text-sm text-stone-300 leading-snug mt-1">
          {truncate(cve.description, 120)}
        </p>
      </CardContent>

      <CardFooter className="pt-2 text-xs text-stone-500 flex justify-between">
        <span>Pub: {mounted ? new Date(cve.publishedDate).toLocaleDateString() : "--"}</span>
      </CardFooter>
    </Card>
  );
}
