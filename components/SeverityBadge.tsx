import { Badge } from "@/components/ui/badge";
import { CVESeverity } from "@/types/cve";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: CVESeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold uppercase tracking-wider",
        {
          "border-red-500 text-red-500": severity === "CRITICAL",
          "border-orange-500 text-orange-500": severity === "HIGH",
          "border-yellow-500 text-yellow-500": severity === "MEDIUM",
          "border-green-500 text-green-500": severity === "LOW",
          "border-gray-500 text-gray-400": severity === "NONE" || severity === "UNKNOWN",
        },
        className
      )}
    >
      {severity}
    </Badge>
  );
}
