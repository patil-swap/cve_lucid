/* eslint-disable @typescript-eslint/no-explicit-any */
import { CVESummary, CVESeverity } from "@/types/cve";

function getPrimaryMetric(metricList: any[]) {
  if (!metricList || !metricList.length) return null;
  // Always prefer Primary (NVD) over Secondary (CNA) to match standard filtering behavior
  const primary = metricList.find((m: any) => m.type === "Primary");
  return primary || metricList[0];
}

function getSeverity(metrics: any): CVESeverity {
  const v31 = getPrimaryMetric(metrics?.cvssMetricV31);
  if (v31) return v31.cvssData.baseSeverity as CVESeverity;
  
  const v30 = getPrimaryMetric(metrics?.cvssMetricV30);
  if (v30) return v30.cvssData.baseSeverity as CVESeverity;
  
  const v2 = getPrimaryMetric(metrics?.cvssMetricV2);
  if (v2) return v2.baseSeverity as CVESeverity;
  
  return "UNKNOWN";
}

function getScore(metrics: any): number | null {
  const v31 = getPrimaryMetric(metrics?.cvssMetricV31);
  if (v31) return v31.cvssData.baseScore;
  
  const v30 = getPrimaryMetric(metrics?.cvssMetricV30);
  if (v30) return v30.cvssData.baseScore;
  
  const v2 = getPrimaryMetric(metrics?.cvssMetricV2);
  if (v2) return v2.cvssData?.baseScore || null;
  
  return null;
}

const totalResultsCache = new Map<string, { total: number, time: number }>();

async function getTotalResults(queryStr: string, headers: HeadersInit): Promise<number> {
  const now = Date.now();
  const cached = totalResultsCache.get(queryStr);
  if (cached && (now - cached.time < 3600 * 1000)) {
     return cached.total;
  }
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?startIndex=0&resultsPerPage=1${queryStr ? '&' + queryStr : ''}`;
  const res = await fetch(url, { headers });
  if (res.ok) {
     const data = await res.json();
     totalResultsCache.set(queryStr, { total: data.totalResults, time: now });
     return data.totalResults;
  }
  return 0;
}

export async function fetchNvdCVEs(page = 1, resultsPerPage = 20, severity?: string, keyword?: string) {
  const apiKey = process.env.NVD_API_KEY;

  let queryStr = "";
  if (severity && severity !== "ALL") queryStr += `cvssV3Severity=${severity}`;
  if (keyword) queryStr += `${queryStr ? '&' : ''}keywordSearch=${encodeURIComponent(keyword)}`;

  const headers: HeadersInit = {};
  if (apiKey) headers["apiKey"] = apiKey;

  const total = await getTotalResults(queryStr, headers);
  if (total === 0) return { totalResults: 0, page, perPage: resultsPerPage, cves: [] };

  const maxPages = Math.ceil(total / resultsPerPage);
  const targetPage = Math.max(1, Math.min(page, maxPages));
  
  let startIndex = total - (targetPage * resultsPerPage);
  let actualReqSize = resultsPerPage;
  
  if (startIndex < 0) {
      actualReqSize = resultsPerPage + startIndex;
      startIndex = 0;
  }

  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?startIndex=${startIndex}&resultsPerPage=${actualReqSize}${queryStr ? '&' + queryStr : ''}`;
  
  const res = await fetch(url, { headers, next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error(`NVD API error: ${res.status}`);
  }

  const data = await res.json();
  
  if (!data.vulnerabilities) {
     return { totalResults: total, page: targetPage, perPage: resultsPerPage, cves: [] };
  }

  let cves: CVESummary[] = data.vulnerabilities.map((item: any) => {
    const cve = item.cve;
    const description = cve.descriptions?.find((d: any) => d.lang === "en")?.value || "No description available.";
    
    const products: string[] = [];
    if (cve.configurations) {
        cve.configurations.forEach((conf: any) => {
            conf.nodes?.forEach((node: any) => {
                node.cpeMatch?.forEach((match: any) => {
                    if (match.criteria) products.push(match.criteria.split(":")[4]);
                });
            });
        });
    }

    return {
      id: cve.id,
      description,
      cvssScore: getScore(cve.metrics),
      severity: getSeverity(cve.metrics),
      affectedProducts: Array.from(new Set(products)).slice(0, 3).filter(Boolean),
      publishedDate: cve.published,
      lastModifiedDate: cve.lastModified,
      raw: cve,
    };
  });

  cves = cves.reverse();

  return {
    totalResults: total,
    page: targetPage,
    perPage: resultsPerPage,
    cves,
  };
}

export async function fetchSingleCVE(cveId: string): Promise<CVESummary | null> {
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`;
  const headers: HeadersInit = {};
  if (process.env.NVD_API_KEY) headers["apiKey"] = process.env.NVD_API_KEY;
  
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.vulnerabilities || data.vulnerabilities.length === 0) return null;
  
  const item = data.vulnerabilities[0];
  const cve = item.cve;
  const description = cve.descriptions?.find((d: any) => d.lang === "en")?.value || "No description available.";
  
  const products: string[] = [];
  if (cve.configurations) {
      cve.configurations.forEach((conf: any) => {
          conf.nodes?.forEach((node: any) => {
              node.cpeMatch?.forEach((match: any) => {
                  if (match.criteria) products.push(match.criteria.split(":")[4]);
              });
          });
      });
  }

  return {
    id: cve.id,
    description,
    cvssScore: getScore(cve.metrics),
    severity: getSeverity(cve.metrics),
    affectedProducts: Array.from(new Set(products)).slice(0, 3).filter(Boolean),
    publishedDate: cve.published,
    lastModifiedDate: cve.lastModified,
    raw: cve,
  };
}
export function clearNvdCache() {
  totalResultsCache.clear();
}
