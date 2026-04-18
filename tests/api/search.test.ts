import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/search/route';
import { db } from '@/lib/search';

// Mock the database for API tests
vi.mock('@/lib/search', () => ({
  db: {
    prepare: vi.fn(() => ({
      all: vi.fn(() => [
        { id: 'CVE-2023-LIMIT', description: 'Test', cvssScore: 5.0, severity: 'MEDIUM' }
      ]),
      get: vi.fn(() => ({ total: 1 }))
    }))
  }
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
