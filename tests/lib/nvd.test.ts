import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchNvdCVEs, fetchSingleCVE, clearNvdCache } from '@/lib/nvd/client';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';

describe('NVD Client Logic', () => {
  beforeEach(() => {
    clearNvdCache();
  });

  it('correctly handles empty vulnerabilities from NVD API', async () => {
    server.use(
      http.get('https://services.nvd.nist.gov/rest/json/cves/2.0', () => {
        return HttpResponse.json({ totalResults: 0, vulnerabilities: [] });
      })
    );

    const result = await fetchNvdCVEs();
    expect(result.cves).toHaveLength(0);
    expect(result.totalResults).toBe(0);
  });

  it('correctly maps NVD JSON to CVESummary objects', async () => {
    const mockCve = {
      cve: {
        id: 'CVE-2023-1234',
        descriptions: [{ lang: 'en', value: 'Test Description' }],
        metrics: {
          cvssMetricV31: [
            {
              type: 'Primary',
              cvssData: {
                baseScore: 7.5,
                baseSeverity: 'HIGH'
              }
            }
          ]
        },
        published: '2023-01-01T00:00:00Z',
        lastModified: '2023-01-02T00:00:00Z'
      }
    };

    server.use(
      http.get('https://services.nvd.nist.gov/rest/json/cves/2.0', ({ request }) => {
        const url = new URL(request.url);
        const resultsPerPage = url.searchParams.get('resultsPerPage');
        
        // Return both meta and data to simulate real behavior consistently
        return HttpResponse.json({
          totalResults: 1,
          vulnerabilities: [mockCve]
        });
      })
    );

    const result = await fetchNvdCVEs(1, 20);
    expect(result.cves).toHaveLength(1);
    const summary = result.cves[0];
    expect(summary.id).toBe('CVE-2023-1234');
    expect(summary.cvssScore).toBe(7.5);
    expect(summary.severity).toBe('HIGH');
    expect(summary.description).toBe('Test Description');
  });

  it('fetchSingleCVE returns null on API error', async () => {
    server.use(
      http.get('https://services.nvd.nist.gov/rest/json/cves/2.0', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const result = await fetchSingleCVE('CVE-2023-1234');
    expect(result).toBeNull();
  });
});
