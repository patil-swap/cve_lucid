import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/search/route';
import { getDb } from '@/lib/search';

// Mock the database for API tests
vi.mock('@/lib/search', () => ({
  getDb: vi.fn(async () => ({
    execute: vi.fn(async (params) => {
      const sql = typeof params === 'string' ? params : params.sql;
      if (sql.includes('COUNT(*)')) {
        return { rows: [{ total: 1 }] };
      }
      return {
        rows: [
          { id: 'CVE-2023-LIMIT', description: 'Test', cvssScore: 5.0, severity: 'MEDIUM' }
        ]
      };
    })
  }))
}));

describe('Search API Route', () => {
  it('returns a formatted response with results and total count', async () => {
    const req = new Request('https://localhost/api/search?q=test');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cves).toHaveLength(1);
    expect(data.totalResults).toBe(1);
    expect(data.cves[0].id).toBe('CVE-2023-LIMIT');
  });

  it('handles requests missing q and severity with 400', async () => {
    const req = new Request('https://localhost/api/search');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Missing search query or filter");
  });
});
