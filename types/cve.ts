export type CVESeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "UNKNOWN";

export interface CVESummary {
  id: string;
  description: string;
  cvssScore: number | null;
  severity: CVESeverity;
  affectedProducts: string[];
  publishedDate: string;
  lastModifiedDate: string;
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
