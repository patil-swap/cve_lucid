export type CVESeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "UNKNOWN";

export interface VersionRange {
  product: string;
  versionStart: string | null;
  versionEnd: string | null;
  versionEndExcluding: boolean;
}

export interface CVESummary {
  id: string;
  description: string;
  cvssScore: number | null;
  severity: CVESeverity;
  affectedProducts: string[];
  affectedVersionRanges?: VersionRange[];
  publishedDate: string;
  lastModifiedDate: string;
  exploitExists?: number;
  patchAvailable?: number;
  isZeroDay?: number;
  patchDate?: string;
  raw?: any;
}

export interface CVEExplanation {
  technicalReality: string;
  plainEnglish: string;
  analogy: string;
  howToFix: string;
}

export interface CVEApiResponse {
  totalResults: number;
  page: number;
  perPage: number;
  cves: CVESummary[];
}

export const severityColorMap: Record<CVESeverity, string> = {
  CRITICAL: "border-l-red-500",
  HIGH: "border-l-orange-500",
  MEDIUM: "border-l-yellow-500",
  LOW: "border-l-green-500",
  NONE: "border-l-stone-500",
  UNKNOWN: "border-l-stone-800",
};
