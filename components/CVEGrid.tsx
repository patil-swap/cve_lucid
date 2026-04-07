import { CVESummary } from "@/types/cve";
import { CVECard } from "./CVECard";
import { SkeletonCard } from "./SkeletonCard";

interface CVEGridProps {
  cves: CVESummary[];
  isLoading: boolean;
}

export function CVEGrid({ cves, isLoading }: CVEGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (cves.length === 0) {
    return (
      <div className="py-20 text-center text-stone-500">
        No CVEs found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cves.map((cve) => (
        <CVECard key={cve.id} cve={cve} />
      ))}
    </div>
  );
}
